# Supabase setup

Run `schema.sql` in the Supabase SQL Editor, or apply the migration in
`migrations/20260628000000_initial_schema.sql` with the Supabase CLI.

The schema creates:

- `profiles`
- `diary_entries`
- `tags`
- `diary_entry_tags`
- `saved_searches`
- `app_settings`

All tables have Row Level Security enabled. Policies restrict access to rows
owned by `auth.uid()`.

Required app environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
LOCK_HASH_SECRET=
```
