-- Migration: 20261007050000_gallery.sql
-- Description: Module 3.1 Gallery Items schema, media relations, constraints, indexes, and RLS

-- 1. gallery_items table
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media(id) on delete restrict,
  before_media_id uuid references public.media(id) on delete restrict,
  type text not null default 'single' check (type in ('single', 'before_after')),
  title text not null default '',
  caption text not null default '',
  service_category_id uuid references public.service_categories(id) on delete set null,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_before_after_has_before_media check (
    type != 'before_after' or before_media_id is not null
  )
);

create trigger set_gallery_items_updated_at
  before update on public.gallery_items
  for each row execute function public.handle_updated_at();

-- Indexes for gallery_items
create index idx_gallery_items_type on public.gallery_items(type);
create index idx_gallery_items_category on public.gallery_items(service_category_id);
create index idx_gallery_items_published_sort on public.gallery_items(is_published, sort_order);
create index idx_gallery_items_featured on public.gallery_items(is_featured);
create index idx_gallery_items_media on public.gallery_items(media_id);
create index idx_gallery_items_before_media on public.gallery_items(before_media_id);

-- 2. Row Level Security for gallery_items
alter table public.gallery_items enable row level security;

create policy "Gallery items are publicly viewable when published"
  on public.gallery_items
  for select
  to public
  using (is_published = true);

create policy "Admins can select all gallery items"
  on public.gallery_items
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert gallery items"
  on public.gallery_items
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update gallery items"
  on public.gallery_items
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete gallery items"
  on public.gallery_items
  for delete
  to authenticated
  using (public.is_admin());
