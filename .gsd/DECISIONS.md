# DECISIONS.md — Architectural & Design Decisions

> Key decisions that shape the project. All changes must align with these entries.

## 1. Authentication & Authorization

| Status | FINALIZED |
|--------|-----------|
| **Decision** | Use **Supabase Auth** with a strict Role-Based Access Control (RBAC) model. |
| **Context** | We need to support Mess Owners, Super Admins, and Members with different access levels. |
| **Choice** | - **Providers:** Email/Password + Google OAuth.<br>- **Roles:** Stored in `public.user_roles` table, checked via RLS.<br>- **Session:** Handled by Supabase SDK (JWTs). |
| **Consequences** | - Simplified auth logic on frontend.<br>- Critical dependency on `user_roles` table integrity.<br>- RLS policies must join with `user_roles` for admin checks. |

## 2. Data Isolation Strategy

| Status | FINALIZED |
|--------|-----------|
| **Decision** | Use **Row Level Security (RLS)** with `owner_id` column on all sensitive tables. |
| **Context** | Multiple messes will use the platform; one mess owner MUST NOT see another's data. |
| **Choice** | - **Pattern:** Every transactional table (`members`, `expenses`, `inventory`) has an `owner_id` (UUID).<br>- **Policy:** `auth.uid() = owner_id` enforcement for SELECT/UPDATE/DELETE. |
| **Consequences** | - Robust, database-level security.<br>- Developers must remember to include `owner_id` in all inserts.<br>- Queries are automatically filtered, simplifying frontend code. |

## 3. Storage Security

| Status | FINALIZED |
|--------|-----------|
| **Decision** | Use **Private Buckets** with signed URLs or RLS-mediated access. |
| **Context** | Users upload financial receipts. These must not be publicly guessable or accessible. |
| **Choice** | - **Bucket Config:** `public = false`.<br>- **Structure:** `/receipts/{user_id}/{filename}`.<br>- **Policy:** Only `auth.uid()` equal to the folder name can read/write. |
| **Consequences** | - Images won't load with simple public URLs; frontend must use signed URL features or authenticated session.<br>- Significantly reduces data leakage risk. |

## 4. API Protection

| Status | FINALIZED |
|--------|-----------|
| **Decision** | Implement **Rate Limiting** and **Strict CORS** at the Edge/Gateway level. |
| **Context** | Protect key endpoints (Auth, Uploads) from abuse and brute-force attacks. |
| **Choice** | - **Rate Limit:** 10 requests/minute per IP/User for sensitive actions.<br>- **CORS:** Whitelist specific deployment domains only. |
| **Consequences** | - Legitimate power users might hit limits (unlikely for this use case).<br>- Development requires local environment to be whitelisted or mocked. |

## 5. Deployment Infrastructure

| Status | FINALIZED |
|--------|-----------|
| **Decision** | Static Frontend (Netlify/Cloudflare) + Serverless Backend (Supabase). |
| **Context** | Low cost, high availability, easy scalability. |
| **Choice** | - **Frontend:** Vite React build deployed to CDNs.<br>- **Backend:** Supabase managed services (Postgres + Edge Functions). |
| **Consequences** | - Zero server maintenance.<br>- logic requiring long-running processes must be adapted to Edge constraints (time limits). |
