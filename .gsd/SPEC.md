---
status: FINALIZED
created: 2026-02-12
finalized: 2026-02-12
---

# SPEC.md — Project Specification

## Vision

Mess Manager Pro is a comprehensive, secure management system designed to streamline the operations of mess facilities (hostels, canteens). Version 2.2 focuses on hardening security to enterprise standards, ensuring data isolation, secure asset storage, and robust abuse prevention, transforming it from a functional prototype into a production-ready, trustworthy platform for managing members, inventory, and finances.

## Phase 3: Feature Expansion & Polish (v2.4)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Dashboard** | Member Renewal Notifications (in-app), WhatsApp Payment Reminders, Edit Payment History capability. | P0 |
| **Landing Page** | Sync Pricing section with Dashboard pricing card. | P1 |
| **Superadmin** | Tenant Management (Edit subscription), Resource Usage Tracker (Supabase/Cloudinary). | P1 |
| **UI Fixes** | Fix Payment Calendar glitch. | P0 |

## Phase 2: Performance Optimization (v2.3) [COMPLETED]
- **Code Splitting:** `React.lazy` implemented.
- **Build:** Vendor chunking configured.
- **Assets:** Preconnect hints added.

---

## Goals

1.  **Production-Grade Security**
    Implement rigorous Row Level Security (RLS) policies, private storage buckets, and server-side validtion to prevent unauthorized data access and cross-user data leakage.

2.  **Abuse Prevention & Reliability**
    Deploy rate limiting (max 10 req/min), whitelist-based CORS, and strict file validation (type/size) to protect the API and storage from abuse and DoS attacks.

3.  **Comprehensive Audit & Observability**
    Establish a complete audit trail for sensitive actions and implement production-safe logging (no sensitive info in console) to enable monitoring and rapid incident response.

---

## Non-Goals (Out of Scope)

Explicitly NOT part of this specific phase (focused on security hardening):

- New feature development (e.g., AI menu planning, advanced analytics) unless related to security.
- Major UI/UX redesigns (except where security requires it, e.g., auth flows).
- Mobile app native development (PWA/Web only).

---

## Users

**Primary User:** Mess Owners/Managers
- **Usage:** Manage day-to-day operations: member registration, inventory tracking, expense recording, and menu planning.
- **Need:** A reliable, secure platform where they can't accidentally see or modify another mess's data.

**Secondary User:** Super Administrators
- **Usage:** System oversight, security auditing, and platform management.
- **Need:** Full visibility into audit logs and system health without exposing user data unnecessarily.

**Tertiary User:** Mess Members
- **Usage:** View menus, check their own attendance/dues (implied).
- **Need:** Assurance that their personal data is secure.

---

## Constraints

### Technical
- **Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn-ui, Supabase (Auth, DB, Storage, Edge Functions).
- **Performance:** No "flash of unstyled content", fast load times (<2.5s LCP).
- **Security:** OWASP Top 10 compliance compliance (where applicable), specifically Broken Access Control and Sensitive Data Exposure.

### Timeline
- Immediate deployment required (Security Hardening Package v2.2).

### Deployment
- Must be deployable to Cloudflare Pages or Netlify.
- Database migrations must be transactional and safe.

---

## Success Criteria

How we know the project is successful:

- [ ] **Storage Security:** Receipts bucket is `private`, and users can ONLY access files they uploaded.
- [ ] **Data Isolation:** RLS policies prevent any user from querying data (`members`, `expenses`, etc.) belonging to another `owner_id`.
- [ ] **Abuse Resistance:** 11th request in 1 minute triggers `429 Too Many Requests`.
- [ ] **Secure Uploads:** Attempting to upload an `.exe` or >5MB file fails server-side.
- [ ] **Audit Trail:** Critical actions (DELETE/UPDATE) on financial tables are logged to `audit_logs`.
- [ ] **Clean Logs:** No sensitive tokens or PII visible in browser console in production build.

---

## Prior Art

Existing solutions or inspiration:

| Solution | Pros | Cons | Relevance |
|----------|------|------|-----------|
| Standard Excel/Paper | Flexible, free | Insecure, error-prone, no backups | The baseline we are replacing. |
| Generic ERPs | Feature-rich | Expensive, complex, not tailored to "Mess" logic | Too heavy for target users. |
| Previous v2.1 | Functional | Critical security gaps (public buckets, weak RLS) | The base we are hardening. |

---

## Open Questions

Questions to resolve during planning:

- [ ] Are there specific regional compliance requirements (e.g., GDPR equivalents) for the target user base?
- [ ] Do we need a "soft delete" mechanism for recovering accidentally deleted data, or is the audit log sufficient?

---

## Decisions

Key decisions made during specification:

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| **Auth Provider** | Supabase Auth (Google + Email) | Integrated, secure, handles session management out-of-the-box. | 2025-02-09 |
| **Storage Strategy** | Private Buckets + Signed URLs | Public buckets are too risky for financial proofs (receipts). | 2025-02-09 |
| **RLS Architecture** | Owner-based (`owner_id`) | Simplest and most effective way to isolate tenant data. | 2025-02-09 |
