-- Migration: 20261007010000_media_library.sql
-- Description: Media library table, storage bucket, and RLS policies

-- 1. media table
create table public.media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  file_name text not null,
  alt_text text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_media_created_at on public.media(created_at desc);

-- 2. Media Table RLS
alter table public.media enable row level security;

create policy "Media is publicly readable"
  on public.media
  for select
  to public
  using (true);

create policy "Admins can insert media records"
  on public.media
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update media records"
  on public.media
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete media records"
  on public.media
  for delete
  to authenticated
  using (public.is_admin());

-- 3. Storage Bucket Configuration
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Storage Objects Policies for 'media' bucket
create policy "Media bucket objects are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'media');

create policy "Admins can upload to media bucket"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "Admins can update media bucket objects"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "Admins can delete media bucket objects"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media' and public.is_admin());
