create table if not exists public.stripe_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_session_id text not null unique,
  credits integer not null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

alter table public.stripe_checkout_sessions add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.stripe_checkout_sessions add column if not exists stripe_session_id text;
alter table public.stripe_checkout_sessions add column if not exists credits integer not null default 0;
alter table public.stripe_checkout_sessions add column if not exists status text not null default 'completed';
alter table public.stripe_checkout_sessions add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stripe_checkout_sessions_stripe_session_id_key'
      and conrelid = 'public.stripe_checkout_sessions'::regclass
  ) then
    alter table public.stripe_checkout_sessions add constraint stripe_checkout_sessions_stripe_session_id_key unique (stripe_session_id);
  end if;
end $$;

create index if not exists stripe_checkout_sessions_user_id_idx on public.stripe_checkout_sessions(user_id);
create index if not exists stripe_checkout_sessions_stripe_session_id_idx on public.stripe_checkout_sessions(stripe_session_id);

create or replace function public.process_stripe_credit_purchase(
  p_user_id uuid,
  p_stripe_session_id text,
  p_credits integer,
  p_package_name text
)
returns table(processed boolean, remaining_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_session_id uuid;
  updated_credits integer;
begin
  if p_credits <= 0 then
    raise exception 'p_credits must be positive';
  end if;

  select id into existing_session_id
  from public.stripe_checkout_sessions
  where stripe_session_id = p_stripe_session_id;

  if existing_session_id is not null then
    select credits into updated_credits from public.users where id = p_user_id;
    return query select false, coalesce(updated_credits, 0);
    return;
  end if;

  insert into public.stripe_checkout_sessions (user_id, stripe_session_id, credits, status)
  values (p_user_id, p_stripe_session_id, p_credits, 'completed');

  update public.users
  set credits = credits + p_credits,
      updated_at = now()
  where id = p_user_id
  returning credits into updated_credits;

  if updated_credits is null then
    raise exception 'User profile not found for Stripe credit purchase';
  end if;

  insert into public.credit_transactions (user_id, amount, type, description)
  values (p_user_id, p_credits, 'purchase', 'Stripe credit purchase: ' || coalesce(p_package_name, 'Credit package'));

  return query select true, updated_credits;
end;
$$;

grant execute on function public.process_stripe_credit_purchase(uuid, text, integer, text) to service_role;

alter table public.stripe_checkout_sessions enable row level security;

drop policy if exists "Users can read own Stripe checkout sessions" on public.stripe_checkout_sessions;
create policy "Users can read own Stripe checkout sessions"
on public.stripe_checkout_sessions for select to authenticated
using (auth.uid() = user_id);
