alter table public.users add column if not exists email_verified_at timestamptz;
alter table public.users add column if not exists signup_bonus_eligible boolean not null default false;
alter table public.users add column if not exists signup_bonus_granted_at timestamptz;
alter table public.users alter column credits set default 0;

alter table public.credit_transactions add column if not exists reference text;

create unique index if not exists credit_transactions_one_signup_bonus_per_user_idx
on public.credit_transactions(user_id)
where type = 'signup_bonus';

create table if not exists public.signup_rate_limits (
  id uuid primary key default gen_random_uuid(),
  hashed_ip text,
  hashed_device_id text,
  email_hash text,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.signup_rate_limits add column if not exists hashed_ip text;
alter table public.signup_rate_limits add column if not exists hashed_device_id text;
alter table public.signup_rate_limits add column if not exists email_hash text;
alter table public.signup_rate_limits add column if not exists event_type text not null default 'signup';
alter table public.signup_rate_limits add column if not exists created_at timestamptz not null default now();

create index if not exists signup_rate_limits_ip_created_at_idx on public.signup_rate_limits(hashed_ip, created_at);
create index if not exists signup_rate_limits_device_created_at_idx on public.signup_rate_limits(hashed_device_id, created_at);
create index if not exists signup_rate_limits_email_created_at_idx on public.signup_rate_limits(email_hash, created_at);

create or replace function public.grant_verified_signup_bonus(
  p_user_id uuid,
  p_email text default null,
  p_amount integer default 50
)
returns table(processed boolean, remaining_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_credits integer;
  eligible boolean;
begin
  if p_amount <= 0 then
    raise exception 'p_amount must be positive';
  end if;

  select signup_bonus_eligible
  into eligible
  from public.users
  where id = p_user_id
  for update;

  if eligible is null then
    raise exception 'User profile not found for signup bonus';
  end if;

  update public.users
  set email_verified_at = coalesce(email_verified_at, now()),
      updated_at = now()
  where id = p_user_id;

  if not eligible then
    select credits into updated_credits from public.users where id = p_user_id;
    return query select false, coalesce(updated_credits, 0);
    return;
  end if;

  insert into public.credit_transactions (user_id, amount, type, description, reference)
  values (p_user_id, p_amount, 'signup_bonus', 'Verified signup bonus', 'verified_signup_bonus')
  on conflict do nothing;

  if not found then
    select credits into updated_credits from public.users where id = p_user_id;
    return query select false, coalesce(updated_credits, 0);
    return;
  end if;

  update public.users
  set credits = credits + p_amount,
      signup_bonus_eligible = false,
      signup_bonus_granted_at = coalesce(signup_bonus_granted_at, now()),
      updated_at = now()
  where id = p_user_id
  returning credits into updated_credits;

  return query select true, updated_credits;
exception
  when unique_violation then
    select credits into updated_credits from public.users where id = p_user_id;
    return query select false, coalesce(updated_credits, 0);
end;
$$;

revoke execute on function public.grant_verified_signup_bonus(uuid, text, integer) from public;
revoke execute on function public.grant_verified_signup_bonus(uuid, text, integer) from anon;
revoke execute on function public.grant_verified_signup_bonus(uuid, text, integer) from authenticated;
grant execute on function public.grant_verified_signup_bonus(uuid, text, integer) to service_role;

alter table public.signup_rate_limits enable row level security;

drop policy if exists "No client access to signup rate limits" on public.signup_rate_limits;
create policy "No client access to signup rate limits"
on public.signup_rate_limits for select to authenticated
using (false);
