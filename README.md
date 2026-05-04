# Chess Grande Payroll (Static HTML App)

This is a plain HTML/CSS/JavaScript payroll app designed for static hosting.

## Things to Add in the Future
1. User Profile Pictures
2. Fixes to wording
3. New 'processed' filter for entries in manager-dashboard.html
4. Nicer UI probably
5. Email Confirmation
6. Colour coding for type of entry
7. Any requested feature


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

If your database was already created before profile customization was added, run:

```sql
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists bank_account_number text;
alter table public.profiles add column if not exists bank_name text;
alter table public.profiles add column if not exists account_type text;
alter table public.payroll_submissions add column if not exists bank_name text;
alter table public.payroll_submissions add column if not exists account_type text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
add constraint profiles_role_check
check (role in ('employee', 'manager', 'webadmin'));
```

## Claim Proof Images (Private Cloudflare R2)

Claim proof images now use a private Cloudflare R2 bucket via a Cloudflare Worker.

The app pages that use claim images are:
- `./chess-timesheet.html` (upload + preview)
- `./chess-timesheet-pay.html` (preview + submission payload)
- `./manager-entry.html` (manager proof viewing)

### 1) Configure frontend worker URL

Open `claim-proof-storage.js` and replace:
- `PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE`

### 2) Deploy worker

Use the template at:
- `./cloudflare-worker/claim-proof-worker.js`

Set Worker secrets/bindings:
- `CLAIM_PROOFS_BUCKET` (R2 binding)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WORKER_UPLOAD_TOKEN_SECRET` (long random secret)
- `PUBLIC_WORKER_BASE_URL` (your deployed worker URL)

### 3) Data in Supabase

The app stores only a stable object key/path (for example `r2/<user-id>/<month>/...`) in:
- `payroll_entries.claim_image_url`

Legacy Supabase claim image paths/URLs still render through compatibility fallback.

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
- `./webadmin-dashboard.html`
