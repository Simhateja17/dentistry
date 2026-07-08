# Dental PMS — Build Plan

Single self-contained offline `.html` app for Indian dental clinics. Vite + React + JSX, IndexedDB, GST-correct billing, full FDI odontogram, English UI + Telugu patient-facing outputs, PIN-based shared-PC auth. Packaged via `vite-plugin-singlefile` (old `__bundler` loader/manifest deleted; PNG logo + Inter woff2 inlined as data-URIs).

---

## Phase 1 — Foundation

Goal: runnable app skeleton with persistence, real config, and auth. No clinical modules yet — every screen is a placeholder reading real settings.

- Scaffold Vite + React + JSX project in a new `app/` directory (separate from the standalone bundle).
- Extract the demo's existing UI shell (header, sidebar nav, card/table primitives, count-up animations, Inter font, brand colors) into reusable React components.
- Stand up the **IndexedDB layer**: a small wrapper (db open, object stores, CRUD helpers, transactions). Object stores: `clinicSettings`, `patients`, `appointments`, `visits`, `plans`, `labCases`, `invoices`, `stock`, `stockBatches`, `supplierOrders`, `staffTimesheets`, `chartSnapshots`.
- **`ClinicSettings` doc**: single record holding clinic identity (name, address, GSTIN, registration #, phone), hours, chairs, slot duration, buffer, invoice prefix + next number, GST rate table, payment modes, team roster (name/role/PIN/permissions/chairs), and the curated onboarding choices (scheduling mode, tooth-numbering system, invoice template, dashboard layout). Role-gated writes (owner/doctor edits financial+tax; receptionist edits own profile only).
- **Setup wizard** (first-run only, when no `ClinicSettings` exists): branded welcome → 4 real steps — (1) clinic identity + GSTIN + registration, (2) hours + chairs + slot duration + buffer, (3) GST rates + invoice prefix + payment modes, (4) curated choices (scheduling mode / numbering / invoice template / dashboard layout) → create-owner-profile (name + 4-digit PIN) → land on Dashboard.
- **PIN auth**: lock screen with profile tiles (names only) → 4-digit PIN entry. Auto-lock after configurable idle (default 5 min). Owner PIN-reset for any staff. 5-try lockout, unlockable by owner. Last-used profile pre-selected on subsequent launches.
- **First-run guide** on the empty Dashboard: "add your first patient / book first appointment / finish setup" checklist shown when DB is empty.
- One-click **JSON export/import** backup (Settings screen) — downloads/ restores the full DB.

**Exit criteria:** app launches, runs the wizard on first run, persists `ClinicSettings`, PIN-locks, exports/imports a backup. All module screens are placeholders.

---

## Phase 2 — Core clinic loop

Goal: the daily spine a dentist+receptionist lives in. Retires the two biggest risks early — the odontogram and GST billing.

- **Patients registry**: searchable list (name/phone/MRN), filters (active/all), `Today` toggle (patients with an appointment or visit today). Click → Patient Record (Phase 2 builds the summary + today hooks; full timeline in Phase 3). **Register-and-book** flow: new patient form (identity + clinical profile: allergies, med history, conditions) → offers to book an appointment. Phone de-dup with merge suggestion.
- **Appointments engine**: day grid (chairs × time slots from hours + slot duration + buffer), selectable list/week views per the onboarding scheduling-mode choice. Conflict-guarded (chair free, doctor available, buffer respected; patient double-book allowed with confirmation). Status flow: Booked → Arrived → Ready-for-Doctor → In-Chair → Completed → (auto-creates Visit) | Cancelled / No-Show. Recurring appointments (e.g. weekly braces). Walk-ins create ad-hoc appointments.
- **Visit entity + full odontogram**: a completed appointment becomes a Visit (walk-ins create one without an appointmentRef). Rich Visit: findings (chart delta vs last visit), diagnosis text, treatment-performed per tooth/surface with materials used, prescriptions[], auto-draft invoice lines, next-visit recommendation, visit notes. **Full FDI odontogram** (32 teeth; per-tooth status: sound/caries/filled/missing/crown/implant/root-canal/etc.; per-surface conditions: mesial/distal/occlusal/buccal/lingual). Each visit snapshots the chart state into `chartSnapshots` for history replay.
- **Billing / Invoice + jsPDF receipts**: multi-line invoice (auto-filled from the Visit's draft lines, editable). Per-line GST treatment (Exempt 0% / 5% / 12% / 18%), HSN/SAC code, taxable value, CGST+SGST or IGST split, round-off, total. Sequential invoice number honoring the onboarding prefix. Cancel/credit-note support. **jsPDF receipt** PDF: clinic name + address + GSTIN + registration, invoice #/date, patient, line items with HSN + treatment + amount, CGST/SGST split, total, payment mode, bilingual EN+Telugu thank-you. Downloadable/shareable; re-print any past invoice.

**Exit criteria:** a dentist can register a patient, book+seat them, chart findings/treatment on the odontogram, and produce a GST-correct PDF receipt. Data persists across reloads.

---

## Phase 3 — Operations

Goal: the surrounding modules that make the clinic run beyond the core visit.

- **Patient Records (full)**: unified left-summary (identity, allergies/conditions, contact) + right reverse-chrono timeline (Visits / Plans / Lab / Invoices, color-coded, expandable, deep-dive into any item). Current odontogram with a **history scrubber** — drag to any past visit to replay the chart state that day.
- **Treatment Plans**: staged quote + staged billing (no consent). Plan = patientRef + stages[] (each: teeth/surfaces, procedure, cost, materials, sequence). Lifecycle: Draft → Approved → Deposit-paid → In-progress (stages marked done as Visits complete them, auto-billing each) → Completed. Stage payments tracked against invoice lines.
- **Lab Cases**: linked pipeline — LabCase = patientRef + labName + appliance type (crown/bridge/aligner/retainer/denture) + teeth + due date + stages (Impression sent → In-design → In-fabrication → Ready-for-fitting → Fitted). Linked to a Treatment Plan stage or a standalone Visit's treatment. When status = Ready-for-fitting, auto-suggest a fitting appointment. Tracks lab cost + patient charge; overdue reminders.
- **Clinical Stock**: full batch/lot inventory. Each stock item has batches[] (lot #, received date, quantity, expiry date). Dispensing (from a Visit's materials-used) draws FIFO from the soonest-expiring batch. Alerts: expiring-soon (30/60/90 days), expired (block use with override + reason), below reorder level. Dispensing audit trail.
- **Supplier Orders**: PO → received → stock-in. Auto-suggested POs from reorder levels. Receiving a PO increments the relevant stock batches.
- **Staff on Duty**: today's clocked-in roster (PIN login = clock-in), role + current activity (e.g. "Dr. Dev: in-chair with patient X"). Clock-in/out persisted per day in `staffTimesheets` for a simple timesheet.
- **Staff Onboarding**: owner-only add-staff flow (name, role, permissions = role-based screen access, set PIN, assign chairs/doctors). Writes the `ClinicSettings.team` roster.

**Exit criteria:** all 11 modules functional and persistent; a clinic can run plans, lab work, inventory, and staff from the app.

---

## Phase 4 — Closeout

Goal: reporting, localization, and final packaging into the single self-contained deliverable.

- **Reports module**: day-close summary (patients seen, revenue by payment mode, outstanding dues). Period totals (week / month / custom range). GST-prep view (total taxable value + CGST/SGST/IGST split per rate slab, exempt-services total, HSN summary — exportable as the figures a CA needs). Top procedures by revenue/count. Stock consumption + expiry report. Lab-cost summary. Export any report as CSV/JSON.
- **Telugu patient-facing outputs**: string table for patient-facing strings (receipt line items, treatment-plan quotes, medication instructions, post-visit notes) rendered in Telugu. UI stays English.
- **Singlefile packaging**: configure `vite-plugin-singlefile` to inline all JS + CSS + assets as base64/data-URIs into one `index.html`. Inline the PNG logo and the Inter woff2 subsets as data-URIs. **Delete the old `__bundler` loader, manifest, template, and patch scripts entirely** — the Vite build replaces them. Verify the output opens from `file://` with zero network calls (fonts included).
- Final pass: role-based nav enforcement (receptionist vs doctor screens), settings-change audit for financial/tax fields, and a full walkthrough of the day-close → backup → lock flow.

**Exit criteria:** one self-contained `.html` opens offline, runs the full clinic, persists + backs up data, prints GST receipts in Telugu, and closes the day with exportable reports.

---

## Out of scope (explicitly removed)

- Insurance & Claims (rare in Indian dental)
- Membership Plans
- e-sign consent + consent audit trail
- Email/password/OTP auth (replaced by local PIN)
- GSTR-1 quarterly e-invoice (IRN/QR) export
- Supplier payable ledger / payroll
- Multi-device sync (offline-only; backend deferred)
