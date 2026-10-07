-- Migration: 20261007090000_blog.sql
-- Description: Module 5.3 Blog Categories and Blog Posts tables, indexes, and RLS

-- 1. blog_categories table
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_blog_categories_updated_at on public.blog_categories;
create trigger set_blog_categories_updated_at
  before update on public.blog_categories
  for each row execute function public.handle_updated_at();

create index if not exists idx_blog_categories_slug on public.blog_categories(slug);
create index if not exists idx_blog_categories_sort_order on public.blog_categories(sort_order);

-- 2. blog_posts table
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content jsonb not null default '{"type": "doc", "content": []}'::jsonb,
  featured_image_id uuid references public.media(id) on delete restrict,
  category_id uuid references public.blog_categories(id) on delete restrict,
  author_name text not null default 'Nandhini Makeup & Jewellery',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  is_featured boolean not null default false,
  reading_time_minutes integer not null default 1 check (reading_time_minutes >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.handle_updated_at();

-- Indexes on slug, status plus published date, category
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_status_published_at on public.blog_posts(status, published_at desc);
create index if not exists idx_blog_posts_category_id on public.blog_posts(category_id);
create index if not exists idx_blog_posts_is_featured on public.blog_posts(is_featured);

-- 3. Row Level Security
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

-- Drop existing policies if any
drop policy if exists "Public can select blog categories" on public.blog_categories;
drop policy if exists "Admins can manage blog categories" on public.blog_categories;
drop policy if exists "Public can read published posts in past" on public.blog_posts;
drop policy if exists "Admins can manage blog posts" on public.blog_posts;

-- Public can read all blog categories
create policy "Public can select blog categories"
  on public.blog_categories
  for select
  using (true);

-- Admins do everything on blog categories
create policy "Admins can manage blog categories"
  on public.blog_categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Public reads only published posts whose published date is in the past
create policy "Public can read published posts in past"
  on public.blog_posts
  for select
  using (status = 'published' and published_at <= now());

-- Admins do everything on blog posts
create policy "Admins can manage blog posts"
  on public.blog_posts
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
