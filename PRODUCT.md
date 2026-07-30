# Product

## Register

product

## Users
Chess Grande employees, managers, and web admins using a browser-based payroll portal during routine admin work. Employees need a clear way to log monthly timesheet activity, attach claim proof, and review pay-related details. Managers and admins need quick access to submissions, review workflows, and role-based oversight without unnecessary friction.

## Product Purpose
This product exists to turn payroll and chess-timesheet submission into a simple, dependable workflow that can run on static hosting with lightweight operational overhead. Success looks like employees being able to complete and submit their monthly records with confidence, while managers and admins can review records quickly, verify proof, and keep the payroll process moving accurately.

## Brand Personality
Warm, sophisticated, academic. The interface should feel welcoming rather than bureaucratic, polished rather than flashy, and thoughtful rather than generic. It should signal care, trust, and competence for a school-like or instructional environment where accuracy matters.

## Anti-references
Do not make this feel like a cold enterprise HR portal, a neon startup dashboard, or a playful kids app. Avoid harsh corporate formality, generic SaaS gradients, dense admin clutter, and any visual language that feels transactional, cheap, or overly gamified.

## Design Principles
1. Make administrative work feel composed: reduce anxiety around payroll by presenting each step with calm clarity.
2. Keep trust visible: emphasize accuracy, legibility, and clear confirmation states so users feel safe submitting important records.
3. Support role-based efficiency: employees, managers, and admins should each get straightforward paths to their primary tasks.
4. Use polish to signal care: refined typography, spacing, and copy should make the portal feel considered and credible.
5. Prefer simple flows over feature noise: every page should help users finish payroll work quickly without decorative distraction.

## Accessibility & Inclusion
No explicit accessibility constraints were provided, but the product should still follow sensible inclusive defaults. Use clear labels, dependable error messaging, readable contrast, keyboard-accessible controls, and motion restraint appropriate for a payroll workflow.

## Capability: Trainee Weekly Pay

### CAPABILITY

Trainees can use the existing timesheet ledger under an alternative compensation policy: a trainee earns one fixed stipend for each qualifying week in which they record eligible work. Additional hours in the same week do not increase that stipend; instead, verified hours accumulate toward promotion to Chess Coach. Existing Chess Coach and Senior Chess Coach payroll remains monthly and hourly.

The trainee's manager sets both the weekly stipend amount and the confirmed-hours target for promotion review.

### CONSTRAINTS

#### Confirmed payroll rules

- The trainee weekly stipend is earned at most once per employee per calendar week.
- A qualifying week contains at least one eligible work entry with more than zero hours.
- Any positive amount of eligible work qualifies; there is no minimum weekly-hours threshold.
- The trainee's manager configures the fixed weekly stipend for that trainee.
- The trainee's manager configures the promotion-hours target for that trainee.
- The weekly stipend is fixed: additional hours in the same week do not increase that week's base pay.
- Claims and expense-only event entries do not activate the weekly stipend. Reimbursements remain separate additions to the payment total.
- The recommended week boundary is Monday 00:00 through Sunday 23:59 in `Asia/Singapore`.
- Active draft entries show projected eligibility only. A payroll obligation is created only from a submitted weekly snapshot.
- To avoid locking a week before all work is logged, normal weekly submission opens after the week ends. Any late correction follows the existing unpaid-undo or manager-correction flow.
- Promotion progress uses legitimate work hours, not the number of entries. Draft hours are projected; submitted hours are pending; manager-verified hours are confirmed.
- Reaching the hours target makes a trainee eligible for promotion review. It must not automatically change seniority or compensation because performance and quality review may still be required.

#### Invariants

- Pay policy is explicit profile data and must not be inferred only from `seniority_level`.
- The applicable pay policy and rate are copied into each submission snapshot so later profile changes cannot alter historical pay.
- A database constraint, not only browser logic, prevents duplicate trainee stipends for the same employee and week.
- Weekly stipend pay and reimbursable costs are stored separately even when presented as one payment total.
- Submitted entries belong to exactly one payroll snapshot and cannot be paid again in another week or month.
- Existing monthly hourly submissions remain readable and payable without migration or recalculation.
- Only managers and webadmins can change a trainee's weekly stipend, promotion target, or pay policy.

### IMPLEMENTATION CONTRACT

#### Actors

- **Trainee:** logs work, reviews weekly earnings, and submits a completed week even when the manager has not yet configured the stipend. Manager-only promotion criteria are not shown.
- **Manager or webadmin:** assigns the trainee pay policy and weekly stipend, reviews weekly submissions, corrects entries, marks payments as paid, and confirms promotion separately.
- **Chess Coach / Senior Chess Coach:** continues using the existing monthly hourly workflow.

#### Employee surfaces

- The timesheet remains the single entry ledger for every seniority level.
- For a trainee, the payroll summary changes from `hourly rate × hours` to:
  - weekly stipend status;
  - hours logged this week;
  - separate reimbursements;
  - total expected weekly payment; and
  - cumulative promotion-hour progress.
- The weekly state should read clearly as `No qualifying work`, `Projected`, `Ready to submit`, `Submitted`, or `Paid`.
- More hours should be framed as progress through real coaching experience, not as a competition or entry-count game.

#### Manager surfaces

- The profile payroll editor shows a role-locked pay structure: trainees always use a weekly stipend, while Chess Coaches and Senior Chess Coaches always use monthly hourly pay.
- When the weekly-stipend policy is selected, the manager also sets that trainee's promotion-hours target.
- The payroll queue identifies weekly trainee submissions separately from monthly hourly submissions and supports week, seniority, and payment-status filters.
- The trainee profile does not expose the configured promotion target or promotion-progress calculations.

#### States and transitions

1. `No qualifying work` — no eligible positive-hour entry in the week.
2. `Projected` — an active qualifying draft exists; the stipend is estimated but not owed.
3. `Ready to submit` — the week has ended and still contains qualifying work.
4. `Submitted` — a weekly snapshot and its entries are locked; promotion hours are pending.
5. `Paid` — a manager marks the snapshot paid; its eligible hours become confirmed promotion hours.
6. `Promotion eligible` — confirmed hours meet or exceed the target; a manager may separately change the employee's seniority and pay policy.

An unpaid submission may return to `Ready to submit` through the existing undo flow. A paid submission requires manager correction and an auditable adjustment rather than employee deletion.

#### Calculation contract

```text
qualifying_work_hours =
  sum(hours for positive-hour, non-expense work entries in the week)

weekly_stipend_pay =
  configured_weekly_stipend if qualifying_work_hours > 0 else 0

weekly_total_pay =
  weekly_stipend_pay + eligible_reimbursements

confirmed_promotion_hours =
  sum(qualifying_work_hours from paid trainee submissions)
```

Timed School Coaching, Replacement, Camp, Private, and Event work should qualify. Claims and expense-only Event entries should not qualify, although their approved cost may still be reimbursed.

#### Data and interface implications

- Add a profile pay policy such as `monthly_hourly` or `weekly_stipend`.
- Add manager-controlled, per-trainee `weekly_stipend_amount` and `promotion_hours_target` fields.
- Generalize payroll submissions with `period_type`, `period_start`, `period_end`, `pay_policy`, `base_pay`, and `reimbursement_pay` snapshot fields. Keep the existing month fields for backward compatibility during rollout.
- Add a partial unique database index for one weekly-stipend submission per employee and `period_start`.
- Perform eligibility and pay calculation in a trusted database function or transaction. The browser may preview the result but must not be the source of truth for payroll.
- Expose a read-only promotion-progress query or view that distinguishes projected, pending, and confirmed hours without double-counting entries.
- Use the same RLS ownership rules as existing submissions: trainees access their own records; managers and webadmins access all records and control policy changes.

#### Observability and operations

- Record the policy, stipend rate, period, calculated work hours, base pay, reimbursements, submitter, submission time, payer, and payment time on every snapshot.
- Surface duplicate-period, zero-qualifying-hour, and policy-mismatch failures as explicit user messages.
- Before rollout, test weeks that cross month/year boundaries, late entries, unpaid undo, manager correction, promotion after a rate change, expense-only weeks, and concurrent double submission.

### NON-GOALS

- Automatically promoting a trainee when the target is reached.
- Paying more stipend for creating more entries in the same week.
- Replacing the existing timesheet ledger.
- Changing Chess Coach or Senior Chess Coach monthly hourly payroll.
- Defining performance or coaching-quality criteria for promotion.
- Treating claims, event costs, or other reimbursements as qualifying work.

### IMPLEMENTATION DECISIONS

- Promotion hours become confirmed when a weekly submission is marked paid. Submitted-but-unpaid hours remain visible as pending.
- A trainee may submit only after the Sunday week close. Work in the active week remains projected.

### HANDOFF

The compensation policy is implemented in the browser workflow and Supabase schema contract. Deploy the updated database schema before enabling `weekly_stipend` on a trainee profile so the manager settings, authoritative weekly submission function, period uniqueness, snapshot fields, RLS, and promotion-hour aggregation are available together.
