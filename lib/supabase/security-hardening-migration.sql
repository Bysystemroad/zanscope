-- Zanscope Critical/High security hardening migration.
-- Safe to run on an existing Supabase database. No data is deleted.

create or replace function public.charge_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text
)
returns table(success boolean, remaining_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_credits integer;
begin
  if p_amount < 0 then
    raise exception 'p_amount must be positive';
  end if;

  if p_amount = 0 then
    select credits into updated_credits from public.users where id = p_user_id;
    return query select true, coalesce(updated_credits, 0);
    return;
  end if;

  update public.users
  set credits = credits - p_amount,
      updated_at = now()
  where id = p_user_id
    and credits >= p_amount
  returning credits into updated_credits;

  if updated_credits is null then
    select credits into updated_credits from public.users where id = p_user_id;
    return query select false, coalesce(updated_credits, 0);
    return;
  end if;

  insert into public.credit_transactions (user_id, amount, type, description)
  values (p_user_id, -p_amount, p_type, p_description);

  return query select true, updated_credits;
end;
$$;

revoke execute on function public.charge_user_credits(uuid, integer, text, text) from public;
revoke execute on function public.charge_user_credits(uuid, integer, text, text) from anon;
revoke execute on function public.charge_user_credits(uuid, integer, text, text) from authenticated;
grant execute on function public.charge_user_credits(uuid, integer, text, text) to service_role;

alter table public.users enable row level security;
alter table public.leads enable row level security;

drop policy if exists "Users can create own profile" on public.users;
drop policy if exists "Users cannot create profiles directly" on public.users;
create policy "Users cannot create profiles directly"
on public.users for insert to authenticated
with check (false);

drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users cannot update profiles directly" on public.users;
create policy "Users cannot update profiles directly"
on public.users for update to authenticated
using (false)
with check (false);

drop policy if exists "Users can create own leads" on public.leads;
drop policy if exists "Users cannot create leads directly" on public.leads;
create policy "Users cannot create leads directly"
on public.leads for insert to authenticated
with check (false);

drop policy if exists "Users can update own leads" on public.leads;
drop policy if exists "Users cannot update leads directly" on public.leads;
create policy "Users cannot update leads directly"
on public.leads for update to authenticated
using (false)
with check (false);
