-- Migration: 20261007100000_seo_system.sql
-- Description: Module 5.5 SEO columns on services, product_categories, products, blog_categories, blog_posts, and seo_pages

-- 1. Add SEO columns to services
alter table public.services
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_social_image_id uuid references public.media(id) on delete restrict,
  add column if not exists noindex boolean not null default false,
  add column if not exists focus_keyword text;

-- 2. Add SEO columns to product_categories
alter table public.product_categories
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_social_image_id uuid references public.media(id) on delete restrict,
  add column if not exists noindex boolean not null default false,
  add column if not exists focus_keyword text;

-- 3. Add SEO columns to products
alter table public.products
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_social_image_id uuid references public.media(id) on delete restrict,
  add column if not exists noindex boolean not null default false,
  add column if not exists focus_keyword text;

-- 4. Add SEO columns to blog_categories
alter table public.blog_categories
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_social_image_id uuid references public.media(id) on delete restrict,
  add column if not exists noindex boolean not null default false,
  add column if not exists focus_keyword text;

-- 5. Add SEO columns to blog_posts
alter table public.blog_posts
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_social_image_id uuid references public.media(id) on delete restrict,
  add column if not exists noindex boolean not null default false,
  add column if not exists focus_keyword text;

-- 6. Add columns to seo_pages (keep og_image_url intact)
alter table public.seo_pages
  add column if not exists og_image_id uuid references public.media(id) on delete restrict,
  add column if not exists focus_keyword text;
