-- Migration: 20261007060000_content_modules.sql
-- Description: Module 3.2 Testimonials, FAQs, and Announcements schemas, constraints, indexes, and RLS

-- 1. testimonials table
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  occasion text,
  quote text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  source text not null check (source in ('google', 'instagram', 'whatsapp', 'direct')),
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.handle_updated_at();

create index idx_testimonials_published_sort on public.testimonials(is_published, sort_order);
create index idx_testimonials_featured on public.testimonials(is_featured);

alter table public.testimonials enable row level security;

create policy "Testimonials are publicly viewable when published"
  on public.testimonials
  for select
  to public
  using (is_published = true);

create policy "Admins can select all testimonials"
  on public.testimonials
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert testimonials"
  on public.testimonials
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update testimonials"
  on public.testimonials
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete testimonials"
  on public.testimonials
  for delete
  to authenticated
  using (public.is_admin());

-- 2. faqs table
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  "group" text not null check ("group" in ('general', 'services', 'jewellery', 'orders_and_shipping', 'orders and shipping')),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_faqs_updated_at
  before update on public.faqs
  for each row execute function public.handle_updated_at();

create index idx_faqs_group_sort on public.faqs("group", sort_order);
create index idx_faqs_published on public.faqs(is_published);

alter table public.faqs enable row level security;

create policy "FAQs are publicly viewable when published"
  on public.faqs
  for select
  to public
  using (is_published = true);

create policy "Admins can select all faqs"
  on public.faqs
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert faqs"
  on public.faqs
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update faqs"
  on public.faqs
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete faqs"
  on public.faqs
  for delete
  to authenticated
  using (public.is_admin());

-- 3. announcements table
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  link_url text,
  link_label text,
  is_active boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_announcements_updated_at
  before update on public.announcements
  for each row execute function public.handle_updated_at();

create index idx_announcements_active on public.announcements(is_active);
create index idx_announcements_dates on public.announcements(start_date, end_date);

alter table public.announcements enable row level security;

create policy "Announcements are publicly viewable when active and in date range"
  on public.announcements
  for select
  to public
  using (
    is_active = true
    and (start_date is null or start_date <= now())
    and (end_date is null or end_date >= now())
  );

create policy "Admins can select all announcements"
  on public.announcements
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert announcements"
  on public.announcements
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update announcements"
  on public.announcements
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete announcements"
  on public.announcements
  for delete
  to authenticated
  using (public.is_admin());
