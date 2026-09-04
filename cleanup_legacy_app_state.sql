-- Execute once in Supabase SQL Editor.
-- The old app stored the complete platform state in Auth metadata.
-- Removing it fixes 431 Request Header Fields Too Large errors.
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'app_state'
where raw_user_meta_data ? 'app_state';
