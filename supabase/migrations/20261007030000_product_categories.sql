-- Migration: 20261007030000_product_categories.sql
-- Description: Module 2.5 Product Categories schema, media foreign key, indexes, and RLS

-- 1. product_categories table
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_id uuid references public.media(id) on delete restrict,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_product_categories_updated_at
  before update on public.product_categories
  for each row execute function public.handle_updated_at();

-- Indexes for product_categories
create index idx_product_categories_slug on public.product_categories(slug);
create index idx_product_categories_sort on public.product_categories(sort_order);
create index idx_product_categories_published on public.product_categories(is_published, sort_order);

-- 2. Row Level Security for product_categories
alter table public.product_categories enable row level security;

create policy "Product categories are publicly viewable when published"
  on public.product_categories
  for select
  to public
  using (is_published = true);

create policy "Admins can select all product categories"
  on public.product_categories
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert product categories"
  on public.product_categories
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update product categories"
  on public.product_categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete product categories"
  on public.product_categories
  for delete
  to authenticated
  using (public.is_admin());
