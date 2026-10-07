-- Migration: 20261007040000_products.sql
-- Description: Module 2.6 Products and Product Images schema, indexes, constraints, and RLS

-- 1. products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10, 2) not null check (price > 0),
  sale_price numeric(10, 2) check (
    sale_price is null or (sale_price > 0 and sale_price < price)
  ),
  sku text unique check (sku is null or length(trim(sku)) > 0),
  stock_status text not null default 'in_stock' check (
    stock_status in ('in_stock', 'out_of_stock', 'made_to_order')
  ),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- Indexes for products
create index idx_products_slug on public.products(slug);
create index idx_products_category on public.products(category_id);
create index idx_products_published_sort on public.products(is_published, sort_order);
create index idx_products_category_sort on public.products(category_id, sort_order);
create index idx_products_sku on public.products(sku);
create index idx_products_stock_status on public.products(stock_status);

-- 2. product_images table
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_product_images_product_sort on public.product_images(product_id, sort_order);
create index idx_product_images_media on public.product_images(media_id);

-- 3. Row Level Security

-- products RLS
alter table public.products enable row level security;

create policy "Products are publicly viewable when published"
  on public.products
  for select
  to public
  using (is_published = true);

create policy "Admins can select all products"
  on public.products
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert products"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete products"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

-- product_images RLS
alter table public.product_images enable row level security;

create policy "Images of published products are publicly viewable"
  on public.product_images
  for select
  to public
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
      and p.is_published = true
    )
  );

create policy "Admins can select all product images"
  on public.product_images
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert product images"
  on public.product_images
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update product images"
  on public.product_images
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete product images"
  on public.product_images
  for delete
  to authenticated
  using (public.is_admin());
