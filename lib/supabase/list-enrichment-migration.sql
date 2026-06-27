alter table public.leads alter column search_id drop not null;

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
alter table public.enrichment_job_items add column if not exists city text;
alter table public.enrichment_job_items add column if not exists country text;
alter table public.enrichment_job_items add column if not exists lead_score integer not null default 0;
alter table public.enrichment_job_items add column if not exists lead_quality text not null default 'Low Quality';
alter table public.enrichment_job_items add column if not exists enrichment_status text not null default 'Not Found';
alter table public.enrichment_job_items add column if not exists duplicate_count integer not null default 1;
alter table public.enrichment_job_items add column if not exists created_at timestamptz not null default now();

create index if not exists enrichment_jobs_user_id_idx on public.enrichment_jobs(user_id);
create index if not exists enrichment_job_items_job_id_idx on public.enrichment_job_items(job_id);
create index if not exists enrichment_job_items_user_id_idx on public.enrichment_job_items(user_id);
create index if not exists enrichment_job_items_lead_id_idx on public.enrichment_job_items(lead_id);

alter table public.enrichment_jobs enable row level security;
alter table public.enrichment_job_items enable row level security;

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
