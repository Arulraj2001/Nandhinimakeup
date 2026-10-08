-- Migration: 20261008080000_fix_admins_rls_writes.sql
-- Description: Restrict admins table writes exclusively to service-role (drop authenticated write policies)

-- 1. Drop authenticated write policies on public.admins
drop policy if exists "Admins can insert admin records" on public.admins;
drop policy if exists "Admins can update admin records" on public.admins;
drop policy if exists "Admins can delete admin records" on public.admins;

-- With RLS enabled and only the SELECT policy present, no identity except the
-- service role (which bypasses RLS) can insert, update, or delete in public.admins.
