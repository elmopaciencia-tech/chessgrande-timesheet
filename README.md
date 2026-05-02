# Chess Grande Payroll (Static HTML App)

This is a plain HTML/CSS/JavaScript payroll app designed for static hosting.

## Configure Supabase

1. Open `supabase-client.js`.
2. Replace placeholders:
   - `PASTE_YOUR_SUPABASE_URL_HERE`
   - `PASTE_YOUR_SUPABASE_ANON_KEY_HERE`
3. Save the file.

Important:
- Use only the Supabase **anon key** in browser code.
- Never commit or expose the Supabase **service_role** key.

## Create Database Schema

1. In Supabase, open **SQL Editor**.
2. Copy all SQL from `supabase-schema.sql`.
3. Run it.

This creates:
- `profiles`
- `payroll_submissions`
- `payroll_entries`
- Row Level Security (RLS) policies

## Storage Bucket for Claim Images

Create a Supabase Storage bucket named:
- `claim-proofs`

The app uploads claim proof images there and stores the path in `payroll_entries.claim_image_url`.

## Deploy to Vercel (Static)

1. Push this project to GitHub/GitLab/Bitbucket.
2. In Vercel, create a new project from the repo.
3. Framework preset: **Other** (or no framework).
4. Build command: leave empty.
5. Output directory: leave empty (root static files).
6. Deploy.

Routing notes:
- `index.html` redirects to `./login.html`.
- `vercel.json` keeps standard `.html` static behavior.

## Create Manager Users

1. Have the user sign up through `login.html` (they start as `employee`).
2. In Supabase SQL Editor, promote them:

```sql
update public.profiles
set role = 'manager'
where id = 'USER_UUID_HERE';
```

How to get `USER_UUID_HERE`:
- Supabase Dashboard -> Authentication -> Users -> copy the user id.

## App Pages

- `./login.html`
- `./chess-timesheet.html`
- `./chess-timesheet-pay.html`
- `./manager-dashboard.html`
- `./manager-entry.html?id=<submission_id>`
