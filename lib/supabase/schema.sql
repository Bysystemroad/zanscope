create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'Free',
  credits integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  keyword text not null,
  country text,
  city text,
  industry text,
  credit_cost integer not null default 0,
  status text not null default 'complete',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.searches(id) on delete cascade,
  company_name text not null,
  website text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  source text,
  scraper_status text not null default 'pending',
  duplicate_count integer not null default 1,
  lead_score integer not null default 0,
  lead_quality text not null default 'Low Quality',
  created_at timestamptz not null default now()
);

alter table public.leads
add column if not exists lead_score integer not null default 0;

alter table public.leads
add column if not exists lead_quality text not null default 'Low Quality';

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  search_id uuid not null references public.searches(id) on delete cascade,
  file_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lead_lists(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (list_id, lead_id)
);

create index if not exists lead_lists_user_id_idx on public.lead_lists(user_id);
create index if not exists lead_list_items_user_id_idx on public.lead_list_items(user_id);
create index if not exists lead_list_items_list_id_idx on public.lead_list_items(list_id);
create index if not exists lead_list_items_lead_id_idx on public.lead_list_items(lead_id);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null,
  type text not null,
  description text,
  created_at timestamptz not null default now()
);

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
  set credits = credits - p_amount
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
