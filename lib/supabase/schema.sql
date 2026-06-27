create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'Free',
  credits integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists plan text not null default 'Free';
alter table public.users add column if not exists credits integer not null default 100;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  keyword text not null,
  country text,
  city text,
  industry text,
  status text not null default 'complete',
  lead_count integer not null default 0,
  credit_cost integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.searches add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.searches add column if not exists keyword text;
alter table public.searches add column if not exists country text;
alter table public.searches add column if not exists city text;
alter table public.searches add column if not exists industry text;
alter table public.searches add column if not exists status text not null default 'complete';
alter table public.searches add column if not exists lead_count integer not null default 0;
alter table public.searches add column if not exists credit_cost integer not null default 0;
alter table public.searches add column if not exists created_at timestamptz not null default now();
alter table public.searches add column if not exists updated_at timestamptz not null default now();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  search_id uuid not null references public.searches(id) on delete cascade,
  company_name text not null,
  website text,
  email text,
  phone text,
  address text,
  linkedin_url text,
  city text,
  country text,
  industry text,
  source text,
  scraper_status text not null default 'pending',
  duplicate_count integer not null default 1,
  lead_score integer not null default 0,
  lead_quality text not null default 'Low Quality',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.leads add column if not exists search_id uuid references public.searches(id) on delete cascade;
alter table public.leads add column if not exists company_name text;
alter table public.leads add column if not exists website text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists address text;
alter table public.leads add column if not exists linkedin_url text;
alter table public.leads add column if not exists city text;
alter table public.leads add column if not exists country text;
alter table public.leads add column if not exists industry text;
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists scraper_status text not null default 'pending';
alter table public.leads add column if not exists duplicate_count integer not null default 1;
alter table public.leads add column if not exists lead_score integer not null default 0;
alter table public.leads add column if not exists lead_quality text not null default 'Low Quality';
alter table public.leads add column if not exists created_at timestamptz not null default now();
alter table public.leads add column if not exists updated_at timestamptz not null default now();
alter table public.leads alter column search_id drop not null;

update public.leads as l
set user_id = s.user_id
from public.searches as s
where l.search_id = s.id
  and l.user_id is null;

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  search_id uuid references public.searches(id) on delete cascade,
  file_url text not null,
  created_at timestamptz not null default now()
);

alter table public.exports add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.exports add column if not exists search_id uuid references public.searches(id) on delete cascade;
alter table public.exports add column if not exists file_url text;
alter table public.exports add column if not exists created_at timestamptz not null default now();

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null,
  type text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.credit_transactions add column if not exists amount integer not null default 0;
alter table public.credit_transactions add column if not exists type text;
alter table public.credit_transactions add column if not exists description text;
alter table public.credit_transactions add column if not exists created_at timestamptz not null default now();

create table if not exists public.lead_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lead_lists add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.lead_lists add column if not exists name text;
alter table public.lead_lists add column if not exists description text;
alter table public.lead_lists add column if not exists created_at timestamptz not null default now();
alter table public.lead_lists add column if not exists updated_at timestamptz not null default now();

create table if not exists public.lead_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lead_lists(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (list_id, lead_id)
);

alter table public.lead_list_items add column if not exists list_id uuid references public.lead_lists(id) on delete cascade;
alter table public.lead_list_items add column if not exists lead_id uuid references public.leads(id) on delete cascade;
alter table public.lead_list_items add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.lead_list_items add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_list_items_list_id_lead_id_key'
      and conrelid = 'public.lead_list_items'::regclass
  ) then
    alter table public.lead_list_items add constraint lead_list_items_list_id_lead_id_key unique (list_id, lead_id);
  end if;
end $$;

create table if not exists public.enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  row_count integer not null default 0,
  unique_count integer not null default 0,
  credit_cost integer not null default 0,
  status text not null default 'complete',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enrichment_jobs add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.enrichment_jobs add column if not exists file_name text;
alter table public.enrichment_jobs add column if not exists row_count integer not null default 0;
alter table public.enrichment_jobs add column if not exists unique_count integer not null default 0;
alter table public.enrichment_jobs add column if not exists credit_cost integer not null default 0;
alter table public.enrichment_jobs add column if not exists status text not null default 'complete';
alter table public.enrichment_jobs add column if not exists created_at timestamptz not null default now();
alter table public.enrichment_jobs add column if not exists updated_at timestamptz not null default now();

create table if not exists public.enrichment_job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.enrichment_jobs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  company_name text not null,
  input_website text,
  input_email text,
  input_phone text,
  website text,
  email text,
  phone text,
  address text,
  linkedin_url text,
  city text,
  country text,
  lead_score integer not null default 0,
  lead_quality text not null default 'Low Quality',
  enrichment_status text not null default 'Not Found',
  duplicate_count integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.enrichment_job_items add column if not exists job_id uuid references public.enrichment_jobs(id) on delete cascade;
alter table public.enrichment_job_items add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.enrichment_job_items add column if not exists lead_id uuid references public.leads(id) on delete set null;
alter table public.enrichment_job_items add column if not exists company_name text;
alter table public.enrichment_job_items add column if not exists input_website text;
alter table public.enrichment_job_items add column if not exists input_email text;
alter table public.enrichment_job_items add column if not exists input_phone text;
alter table public.enrichment_job_items add column if not exists website text;
alter table public.enrichment_job_items add column if not exists email text;
alter table public.enrichment_job_items add column if not exists phone text;
alter table public.enrichment_job_items add column if not exists address text;
alter table public.enrichment_job_items add column if not exists linkedin_url text;
alter table public.enrichment_job_items add column if not exists city text;
alter table public.enrichment_job_items add column if not exists country text;
alter table public.enrichment_job_items add column if not exists lead_score integer not null default 0;
alter table public.enrichment_job_items add column if not exists lead_quality text not null default 'Low Quality';
alter table public.enrichment_job_items add column if not exists enrichment_status text not null default 'Not Found';
alter table public.enrichment_job_items add column if not exists duplicate_count integer not null default 1;
alter table public.enrichment_job_items add column if not exists created_at timestamptz not null default now();

create index if not exists searches_user_id_idx on public.searches(user_id);
create index if not exists leads_user_id_idx on public.leads(user_id);
create index if not exists leads_search_id_idx on public.leads(search_id);
create index if not exists exports_user_id_idx on public.exports(user_id);
create index if not exists exports_search_id_idx on public.exports(search_id);
create index if not exists credit_transactions_user_id_idx on public.credit_transactions(user_id);
create index if not exists lead_lists_user_id_idx on public.lead_lists(user_id);
create index if not exists lead_list_items_user_id_idx on public.lead_list_items(user_id);
create index if not exists lead_list_items_list_id_idx on public.lead_list_items(list_id);
create index if not exists lead_list_items_lead_id_idx on public.lead_list_items(lead_id);
create index if not exists enrichment_jobs_user_id_idx on public.enrichment_jobs(user_id);
create index if not exists enrichment_job_items_job_id_idx on public.enrichment_job_items(job_id);
create index if not exists enrichment_job_items_user_id_idx on public.enrichment_job_items(user_id);
create index if not exists enrichment_job_items_lead_id_idx on public.enrichment_job_items(lead_id);

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

grant execute on function public.charge_user_credits(uuid, integer, text, text) to authenticated;

alter table public.users enable row level security;
alter table public.searches enable row level security;
alter table public.leads enable row level security;
alter table public.exports enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.lead_lists enable row level security;
alter table public.lead_list_items enable row level security;
alter table public.enrichment_jobs enable row level security;
alter table public.enrichment_job_items enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.users;
create policy "Users can create own profile"
on public.users for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read own searches" on public.searches;
create policy "Users can read own searches"
on public.searches for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own searches" on public.searches;
create policy "Users can create own searches"
on public.searches for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own searches" on public.searches;
create policy "Users can update own searches"
on public.searches for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own searches" on public.searches;
create policy "Users can delete own searches"
on public.searches for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own leads" on public.leads;
create policy "Users can read own leads"
on public.leads for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.searches
    where searches.id = leads.search_id
      and searches.user_id = auth.uid()
  )
);

drop policy if exists "Users can create own leads" on public.leads;
create policy "Users can create own leads"
on public.leads for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    search_id is null
    or exists (
      select 1 from public.searches
      where searches.id = leads.search_id
        and searches.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own leads" on public.leads;
create policy "Users can update own leads"
on public.leads for update to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.searches
    where searches.id = leads.search_id
      and searches.user_id = auth.uid()
  )
)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own leads" on public.leads;
create policy "Users can delete own leads"
on public.leads for delete to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.searches
    where searches.id = leads.search_id
      and searches.user_id = auth.uid()
  )
);

drop policy if exists "Users can read own exports" on public.exports;
create policy "Users can read own exports"
on public.exports for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own exports" on public.exports;
create policy "Users can create own exports"
on public.exports for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own exports" on public.exports;
create policy "Users can update own exports"
on public.exports for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own exports" on public.exports;
create policy "Users can delete own exports"
on public.exports for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own credit transactions" on public.credit_transactions;
create policy "Users can read own credit transactions"
on public.credit_transactions for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own lead lists" on public.lead_lists;
create policy "Users can read own lead lists"
on public.lead_lists for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own lead lists" on public.lead_lists;
create policy "Users can create own lead lists"
on public.lead_lists for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own lead lists" on public.lead_lists;
create policy "Users can update own lead lists"
on public.lead_lists for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own lead lists" on public.lead_lists;
create policy "Users can delete own lead lists"
on public.lead_lists for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own lead list items" on public.lead_list_items;
create policy "Users can read own lead list items"
on public.lead_list_items for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.lead_lists
    where lead_lists.id = lead_list_items.list_id
      and lead_lists.user_id = auth.uid()
  )
);

drop policy if exists "Users can create own lead list items" on public.lead_list_items;
create policy "Users can create own lead list items"
on public.lead_list_items for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.lead_lists
    where lead_lists.id = lead_list_items.list_id
      and lead_lists.user_id = auth.uid()
  )
  and exists (
    select 1 from public.leads
    where leads.id = lead_list_items.lead_id
      and (
        leads.user_id = auth.uid()
        or exists (
          select 1 from public.searches
          where searches.id = leads.search_id
            and searches.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "Users can delete own lead list items" on public.lead_list_items;
create policy "Users can delete own lead list items"
on public.lead_list_items for delete to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.lead_lists
    where lead_lists.id = lead_list_items.list_id
      and lead_lists.user_id = auth.uid()
  )
);

drop policy if exists "Users can read own enrichment jobs" on public.enrichment_jobs;
create policy "Users can read own enrichment jobs"
on public.enrichment_jobs for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own enrichment jobs" on public.enrichment_jobs;
create policy "Users can create own enrichment jobs"
on public.enrichment_jobs for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own enrichment jobs" on public.enrichment_jobs;
create policy "Users can update own enrichment jobs"
on public.enrichment_jobs for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own enrichment jobs" on public.enrichment_jobs;
create policy "Users can delete own enrichment jobs"
on public.enrichment_jobs for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own enrichment job items" on public.enrichment_job_items;
create policy "Users can read own enrichment job items"
on public.enrichment_job_items for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own enrichment job items" on public.enrichment_job_items;
create policy "Users can create own enrichment job items"
on public.enrichment_job_items for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.enrichment_jobs
    where enrichment_jobs.id = enrichment_job_items.job_id
      and enrichment_jobs.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own enrichment job items" on public.enrichment_job_items;
create policy "Users can update own enrichment job items"
on public.enrichment_job_items for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own enrichment job items" on public.enrichment_job_items;
create policy "Users can delete own enrichment job items"
on public.enrichment_job_items for delete to authenticated
using (auth.uid() = user_id);
