-- Migration: 20261007080000_legal_pages.sql
-- Description: Module 5.2 Legal Pages table, RLS, and seed rows

create table if not exists public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('privacy-policy', 'terms-and-conditions', 'shipping-and-returns')),
  title text not null,
  content jsonb not null default '{"type": "doc", "content": []}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for updated_at
drop trigger if exists set_legal_pages_updated_at on public.legal_pages;
create trigger set_legal_pages_updated_at
  before update on public.legal_pages
  for each row execute function public.handle_updated_at();

-- Indexes
create index if not exists idx_legal_pages_slug on public.legal_pages(slug);
create index if not exists idx_legal_pages_is_published on public.legal_pages(is_published);

-- Row Level Security
alter table public.legal_pages enable row level security;

-- Drop existing policies if any
drop policy if exists "Public can read published legal pages" on public.legal_pages;
drop policy if exists "Admins can select all legal pages" on public.legal_pages;
drop policy if exists "Admins can update legal pages" on public.legal_pages;

-- Public can read published rows only
create policy "Public can read published legal pages"
  on public.legal_pages
  for select
  using (is_published = true);

-- Admins can select all rows
create policy "Admins can select all legal pages"
  on public.legal_pages
  for select
  to authenticated
  using (public.is_admin());

-- Admins can update legal pages
create policy "Admins can update legal pages"
  on public.legal_pages
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed the three rows: unpublished and empty
insert into public.legal_pages (slug, title, content, is_published)
values
  ('privacy-policy', 'Privacy Policy', '{"type": "doc", "content": []}'::jsonb, false),
  ('terms-and-conditions', 'Terms & Conditions', '{"type": "doc", "content": []}'::jsonb, false),
  ('shipping-and-returns', 'Shipping & Returns Policy', '{"type": "doc", "content": []}'::jsonb, false)
on conflict (slug) do nothing;
