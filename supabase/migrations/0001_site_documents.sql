-- Run once in the Supabase SQL editor (or with the Supabase CLI).
-- Documents (catalog.json, admin-auth.json) are stored as rows; only the
-- service role key used by the server can read or write them.
create table if not exists public.site_documents (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.site_documents enable row level security;
revoke all on public.site_documents from anon, authenticated;

-- Private bucket for images uploaded from the admin panel.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
