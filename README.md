# Chess Grande Payroll Portal

A static web payroll portal for Chess Grande employees, managers, and webadmins, replacing a manual monthly Excel timesheet with a clearer browser-based workflow.

## Before And After

The original workflow was a spreadsheet-first payment sheet: staff filled repeated rows, dates, time blocks, claims, and replacements manually before payroll review. This project turns that into a role-based web app backed by Supabase, with draft entries, monthly pay review, manager oversight, and webadmin profile management.

## Why This Exists

The Excel version worked, but it made payroll depend on careful manual entry across many repeated date columns and category sections. It was easy for staff to miss a session, duplicate a date, or separate claim proof from the payroll line it belonged to.

The web app keeps the familiar monthly ledger idea, but gives each role a focused workflow:

- Employees add coaching sessions, replacements, private work, events, camps, and claims.
- The monthly pay page calculates hours and pay from the same draft ledger.
- Trainees on the manager-assigned weekly-stipend policy receive one fixed stipend for each completed week with positive-hour work. They may submit qualifying weeks before the manager sets the stipend; any manager-only promotion target remains hidden from trainees.
- Managers review submitted payroll snapshots and inspect employee entries.
- Webadmins maintain user profiles, account roles, and operational details.

## How The Web App Is Used

### 1. Employees Build The Monthly Timesheet

Employees work from one monthly view. The calendar shows schedule density, while the activity summary groups entries for review before submission.

### 2. Employees Review And Submit Pay

The pay view mirrors the same entries through a payroll lens. Hourly employees review a monthly calculation, while weekly-stipend trainees review and submit closed Monday–Sunday weeks without seeing manager-only promotion criteria.

### 3. Managers Review Submitted Payroll

Managers get an operational queue for submitted monthly payroll. They can filter by month/year, scan totals, and open an employee submission for deeper review.

### 4. Webadmins Manage Users And Roles

Webadmins manage the user directory from one maintenance screen, including role context for employees, managers, and webadmins.

## What It Is Built With

- Static HTML, CSS, and JavaScript
- Supabase Auth for sign-in
- Supabase Postgres with Row Level Security for profiles, draft entries, submissions, and payroll entries
- Cloudflare Worker + private R2 bucket for claim proof image upload and signed viewing
- Optional OpenRouter + LangChain RAG chatbot for webadmin support documents
- Static hosting on Vercel or Cloudflare Pages

## Claims Images

Claim proof images use a private Cloudflare R2 bucket through a Cloudflare Worker. Used when an employee files a company claim (i.e. Taxi/Grab claims).

Pages that use claim images:

- Employee upload and preview
- Pay review preview
- Manager submitted-entry review

## Webadmin Chatbot

The webadmin dashboard includes an optional AI chat popup. The browser sends the logged-in Supabase token to the Worker, and the Worker verifies the user is a webadmin before calling OpenRouter through LangChain. This is just a proof of concept for now

Upload text, Markdown, CSV, or JSON support documents into the configured R2 prefix for RAG retrieval.

## Deploy

This is a static app, so Cloudflare Pages can serve it without a framework build step.

Routing note: `index.html` redirects to `login.html`; the rest of the app is served as plain `.html` files.

## Repository Privacy

Keep payroll exports, screenshots of real records, browser logs, and local service caches out of Git. Local documentation captures in `assets/readme/` are ignored; they are not part of the public README. Use fictional records for any future public screenshots.

`.assetsignore` also excludes these local artifacts from Cloudflare static asset uploads. Keep server secrets in the deployment secret store. The Supabase browser publishable key is intentionally public and relies on database access policies.

Removing a file from the current repository does not remove it from Git history or existing copies. Previously published sensitive records require a separate history cleanup; exposed active secrets must also be revoked or rotated.

## Roles And Access

New signups start as employees. Promote manager or webadmin accounts from trusted SQL in Supabase:

Allowed roles:

- `employee`
- `manager`
- `webadmin`

## Project Status

Current app pages:

- Login and signup
- Profile setup and profile menu
- Employee timesheet
- Employee monthly pay review
- Manager submitted payroll dashboard
- Manager draft-timesheet editor
- Manager submitted-entry review
- Webadmin user directory

Good next improvements:

- Add a processed filter/state for manager payroll review
- Add email confirmation and notification polish
- Improve entry type color-coding across calendar and ledger views
- Continue unifying the shared Supabase contract with the iOS app
