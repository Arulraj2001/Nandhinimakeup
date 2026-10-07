-- Migration: 20261007020000_services.sql
-- Description: Module 2.4 Services and Service Categories schema, indexes, RLS, and constraints

-- 1. service_categories table
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_service_categories_updated_at
  before update on public.service_categories
  for each row execute function public.handle_updated_at();

-- Indexes for service_categories
create index idx_service_categories_slug on public.service_categories(slug);
create index idx_service_categories_sort on public.service_categories(sort_order);
create index idx_service_categories_published on public.service_categories(is_published, sort_order);

-- 2. services table
create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  short_description text not null default '',
  long_description text not null default '',
  price_type text not null check (price_type in ('fixed', 'starting_from', 'on_request')),
  price numeric(10, 2) check (
    price_type = 'on_request' or (price is not null and price >= 0)
  ),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  image_id uuid references public.media(id) on delete restrict,
  includes_list text[] not null default array[]::text[],
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_services_updated_at
  before update on public.services
  for each row execute function public.handle_updated_at();

-- Indexes for services
create index idx_services_slug on public.services(slug);
create index idx_services_category on public.services(category_id);
create index idx_services_published_sort on public.services(is_published, sort_order);
create index idx_services_category_sort on public.services(category_id, sort_order);
create index idx_services_featured on public.services(is_featured);

-- 3. Row Level Security

-- service_categories RLS
alter table public.service_categories enable row level security;

create policy "Service categories are publicly viewable when published"
  on public.service_categories
  for select
  to public
  using (is_published = true);

create policy "Admins can select all service categories"
  on public.service_categories
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert service categories"
  on public.service_categories
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update service categories"
  on public.service_categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete service categories"
  on public.service_categories
  for delete
  to authenticated
  using (public.is_admin());

-- services RLS
alter table public.services enable row level security;

create policy "Services are publicly viewable when published"
  on public.services
  for select
  to public
  using (is_published = true);

create policy "Admins can select all services"
  on public.services
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert services"
  on public.services
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update services"
  on public.services
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete services"
  on public.services
  for delete
  to authenticated
  using (public.is_admin());
