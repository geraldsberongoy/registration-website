alter table public.registrants
add column if not exists check_in_time timestamptz;
