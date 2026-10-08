# Security Engineering Rules & Guidelines — Ugrahak SaaS

These engineering rules are mandatory for all future development, pull requests, and automated workflows across the Ugrahak codebase.

---

## 1. Secrets Management
1. **Never Commit Secrets**: Never commit API keys, private keys, service role tokens, database URLs, or webhook secrets to git.
2. **Environment Variable Naming**:
   - Only expose variables to the browser if prefixed with `NEXT_PUBLIC_` AND strictly intended for public consumption (e.g. Supabase anon key, Firebase public config).
   - All backend secrets (`SUPABASE_SECRET_KEY`, `FIREBASE_PRIVATE_KEY`, `RAZORPAY_KEY_SECRET`, `CRON_SECRET`, `INNGEST_SIGNING_KEY`) MUST NOT have `NEXT_PUBLIC_` prefix.
3. **Template Sync**: Whenever adding a new environment variable, immediately add an empty placeholder to `.env.example`.
4. **Log Redaction**: Never log authorization tokens, passwords, customer phone numbers, or private keys. Always use the structured logger in `@/lib/observability/logger` which automatically redacts sensitive keywords.

---

## 2. Authentication & Authorization
1. **Merchant-Only Routes**: Every endpoint under `/api/merchant/*` and every merchant page under `/(dashboard)/*` must authenticate the user via `supabase.auth.getUser()`. Never trust client-supplied merchant IDs.
2. **Strict Multi-Tenant Isolation (Anti-IDOR)**:
   - Always derive the merchant context from the authenticated user: `const merchantId = user.id`.
   - Never allow a merchant to query, update, or delete records matching another merchant's ID. All database queries must include `.eq("merchant_id", user.id)` or be strictly governed by Supabase RLS.
3. **Public Customer Flow Boundary**:
   - Customer endpoints under `/api/shop/*` are strictly for public customer check-ins and notification token registration.
   - Customers must never be granted access to merchant analytics, merchant customer tables, or offer creation APIs.

---

## 3. Database & Supabase Row Level Security (RLS)
1. **RLS Enabled by Default**: Every new table in Supabase must have Row Level Security enabled (`ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`).
2. **Service Role Usage**: Use `getAdminClient()` / `SUPABASE_SECRET_KEY` only when executing trusted system tasks (e.g. creating auth users during signup, processing background FCM notifications). Never expose the service client to user-facing input without strict server-side validation.
3. **Foreign Key Integrity**: Always enforce cascading deletes or constraints on tenant relations (`ON DELETE CASCADE` referencing `merchants.id`).

---

## 4. Input Validation & Defense-in-Depth
1. **Strict Type & Schema Validation**:
   - Validate request bodies on the server before database interaction using Zod or strict runtime assertions.
   - Sanitize string inputs to prevent injection and reject invalid payloads early with `400 Bad Request`.
2. **Coordinate & Geospatial Checks**:
   - Any latitude/longitude inputs must be strictly bounded (`-90 <= lat <= 90`, `-180 <= lng <= 180`).
3. **Safe Error Masking**:
   - In production API error handlers (`catch (err)`), never return raw database error messages, stack traces, or internal query parameters to the client. Return clean, localized error descriptions.

---

## 5. Rate Limiting & Denial of Service (DoS) Protection
1. **Public Endpoint Rate Limiting**: All unauthenticated endpoints (`/api/shop/*`, `/api/auth/*`) must enforce IP-based rate limiting (via Upstash Redis or memory fallback) to prevent credential stuffing, SMS/notification spam, and enumeration.
2. **Payload Size Limits**: Ensure Next.js and body parsers enforce standard payload size restrictions (preventing multi-megabyte JSON flood attacks).

---

## 6. HTTP Security Headers & Middleware
1. **Mandatory Headers**: Keep the following headers enforced via `next.config.ts` and `src/lib/supabase/middleware.ts`:
   - `X-Frame-Options: SAMEORIGIN` (prevents Clickjacking)
   - `X-Content-Type-Options: nosniff` (prevents MIME-sniffing)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
2. **CORS Restrictions**: Do not set permissive `Access-Control-Allow-Origin: *` on authenticated merchant routes.

---

## 7. Webhook & Cron Security
1. **Timing-Safe Secret Verification**: Verify cron and webhook signatures using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
2. **Production Enforcement**: Webhook and cron endpoints must immediately reject unauthorized calls in production.

