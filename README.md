# Chess Grande Payroll (HTML WebApp)

This is a HTML/CSS/JavaScript payroll app designed for static hosting. Hosted in Cloudflare Pages, with SupaBase for Authentication and PostgreSQL Backend.

This WebApp contains 3 separate sections:
1. The Employee section where they can access and submit their timesheets for the month
2. The Manager section where they can access the timesheets submitted by Employees
3. The WebAdmin section where they can manage account roles and details.

## Things to Add in the Future
1. Fixes to wording
2. New 'processed' filter for entries in manager-dashboard.html
3. Email Confirmation
4. Colour coding for type of entry
5. Any requested feature


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
- `draft_timesheet_entries`
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

## Webadmin Chatbot (OpenRouter + LangChain RAG)

`webadmin-dashboard.html` includes a bottom-right AI chat popup. The browser sends the logged-in Supabase token to the Cloudflare Worker, and the Worker verifies the user is a `webadmin` before calling OpenRouter through LangChain.

### 1) Install Worker dependencies

```sh
npm install
```

### 2) Configure OpenRouter

Create an OpenRouter API key, then store it as a Worker secret:

```sh
npx wrangler secret put OPENROUTER_API_KEY --config cloudflare-worker/wrangler.toml
```

Optional settings live in `cloudflare-worker/wrangler.toml`:

- `OPENROUTER_MODEL` defaults to `openai/gpt-4.1-mini`
- `RAG_DOCS_PREFIX` defaults to `rag-docs/`
- `OPENROUTER_SITE_NAME` labels the app in OpenRouter

### 3) Add your documents for RAG

Create the R2 bucket if it does not exist:

```sh
npx wrangler r2 bucket create chessgrande-admin-rag
```

Upload text-based documents into the `rag-docs/` prefix:

```sh
npx wrangler r2 object put chessgrande-admin-rag/rag-docs/payroll-policy.md --file ./docs/payroll-policy.md --content-type text/markdown
npx wrangler r2 object put chessgrande-admin-rag/rag-docs/admin-runbook.txt --file ./docs/admin-runbook.txt --content-type text/plain
```

Supported RAG files are `.txt`, `.md`, `.markdown`, `.csv`, and `.json`. For PDFs or Word docs, export or copy the important content into Markdown or plain text first, then upload that file. Keep one topic per file where possible so the chatbot can cite useful source names.

### 4) Deploy the Worker

```sh
npm run worker:deploy
```

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
- `./manager-drafts.html`
- `./manager-entry.html?id=<submission_id>`
- `./webadmin-dashboard.html`
