-- Migration: 20261007000000_init_foundation_schema.sql
-- Description: Phase 1 Foundation schema (admins, site_settings, seo_pages, redirects, triggers, RLS)

-- 1. Updated-at trigger helper function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. admins table
create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

create index idx_admins_user_id on public.admins(user_id);

-- 3. site_settings table
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.handle_updated_at();

-- 4. seo_pages table
create table public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  title text not null,
  description text not null,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger set_seo_pages_updated_at
  before update on public.seo_pages
  for each row execute function public.handle_updated_at();

-- 5. redirects table
create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code smallint not null check (status_code in (301, 302)),
  created_at timestamptz not null default now()
);

-- 6. is_admin helper function
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admins
    where user_id = auth.uid()
  );
$$;

-- 7. Row Level Security (RLS)

-- Admins Table RLS
alter table public.admins enable row level security;

create policy "Admins can view their own admin record"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can insert admin records"
  on public.admins
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update admin records"
  on public.admins
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete admin records"
  on public.admins
  for delete
  to authenticated
  using (public.is_admin());

-- Site Settings Table RLS
alter table public.site_settings enable row level security;

create policy "Site settings are publicly readable"
  on public.site_settings
  for select
  to public
  using (true);

create policy "Admins can insert site settings"
  on public.site_settings
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete site settings"
  on public.site_settings
  for delete
  to authenticated
  using (public.is_admin());

-- SEO Pages Table RLS
alter table public.seo_pages enable row level security;

create policy "SEO pages are publicly readable"
  on public.seo_pages
  for select
  to public
  using (true);

create policy "Admins can insert SEO pages"
  on public.seo_pages
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update SEO pages"
  on public.seo_pages
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete SEO pages"
  on public.seo_pages
  for delete
  to authenticated
  using (public.is_admin());

-- Redirects Table RLS
alter table public.redirects enable row level security;

create policy "Redirects are publicly readable"
  on public.redirects
  for select
  to public
  using (true);

create policy "Admins can insert redirects"
  on public.redirects
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update redirects"
  on public.redirects
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete redirects"
  on public.redirects
  for delete
  to authenticated
  using (public.is_admin());
