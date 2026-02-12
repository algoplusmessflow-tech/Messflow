# PLAN.md — Phase 3: Feature Expansion & Polish

> **Objective:** Deliver the 8 requested features with zero regressions.

## 🌊 Wave 1: UI & Dashboard Basics (Quick Wins)

> **Goal:** Fix visible glitches and sync public content.

- [ ] **Fix Payment Calendar Glitch**
  - Refactor `PaymentModal` to use `popover` date picker (shadcn-ui).
  - Verify z-index issues.
- [ ] **Sync Pricing Page**
  - Copy `PricingCard` component to `PublicHome` or `LandingPage`.
  - Ensure it looks good without auth context.
- [ ] **Member Renewal Notifications**
  - Create `NotificationSystem` (Toast/Modal) in `Dashboard.tsx`.
  - Logic: Check `expiry_date < today + 7 days`.

## 🌊 Wave 2: Payment Logic (High Risk)

> **Goal:** Improve payment management reliability.

- [ ] **WhatsApp Reminder**
  - Update "Due Date Reminder" button.
  - Link to `https://wa.me/{phone}?text={message}`.
  - Message format: "Hello {Name}, your payment of {Amount} is due on {Date}."
- [ ] **Edit Payment History**
  - Add "Edit" action to Payment History table.
  - Create `EditPaymentModal`.
  - Update Supabase record (requires `update` policy check).

## 🌊 Wave 3: Superadmin Tools (Complex)

> **Goal:** operational oversight.

- [ ] **User Management**
  - Add "Edit Plan" to `SuperAdmin` users table.
  - Enforce unique username/email constraint (DB Migration if needed, or app-level check).
- [ ] **Resource Usage Tracker**
  - Integrate Supabase MCP (if available) or use SQL queries for DB size.
  - Visualize storage usage (count files in buckets).
  - Add `ResourceUsageWidget` to Superadmin panel.

## 🔍 Verification Plan
- **Smoke Test:** Create a user, assign a plan, record payment, edit payment.
- **Visual Check:** Mobile responsive check for Pricing and Calendar.
