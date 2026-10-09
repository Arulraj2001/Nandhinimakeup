-- Migration: 20261009080000_add_instagram_links.sql
-- Description: Add instagram_url to testimonials and gallery_items, and allow gallery_items without local media

alter table public.testimonials
  add column if not exists instagram_url text;

alter table public.gallery_items
  add column if not exists instagram_url text,
  alter column media_id drop not null;
