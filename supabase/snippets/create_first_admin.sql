-- Script: create_first_admin.sql
-- Description: Assigns owner admin privileges to a user created in Supabase Auth.
--
-- Steps:
-- 1. Create an admin user account in Supabase:
--    Dashboard -> Authentication -> Users -> Add User (Invite or Create user with email & password).
-- 2. Copy the newly created user's UID.
-- 3. Replace '<REPLACE_WITH_AUTH_USER_UUID>' below with the actual UID and execute in the SQL Editor:

insert into public.admins (user_id, role)
values ('<REPLACE_WITH_AUTH_USER_UUID>', 'owner')
on conflict (user_id) do update set role = 'owner';
