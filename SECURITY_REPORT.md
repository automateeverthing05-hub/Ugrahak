# Security Audit & Penetration Testing Report — Ugrahak SaaS

**Audit Date**: October 2026  
**Auditor**: Senior Application Security Engineer & Penetration Tester  
**Target Application**: Ugrahak (Multi-tenant SaaS for Local Retailers & Loyalty Rewards)  
**Status**: REMEDIATED & HARDENED

---

## 1. Executive Summary

A comprehensive, end-to-end security audit and penetration test was conducted across the Ugrahak SaaS platform. The review covered the application source code (`src/`), API architecture, database migrations, authentication workflows, background jobs, client bundles, and third-party integrations (Supabase, Firebase Cloud Messaging, Upstash Redis, Razorpay, Sentry).

**Overall Security Posture**: **STRONG & PRODUCTION READY**  
All Critical, High, and Medium vulnerabilities identified during the assessment were immediately patched in the codebase. Strict multi-tenant isolation (Anti-IDOR), Row Level Security (RLS), input sanitization, timing-safe authorization, and comprehensive rate limiting are active and verified.

---

## 2. Technology Stack & Attack Surface Overview

- **Framework**: Next.js 15.5.26 (App Router, React 19)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS), Supabase SSR Cookie Auth
- **Push Notification Infrastructure**: Firebase Cloud Messaging (FCM Admin SDK + Web Push Service Worker)
- **Caching & Rate Limiting**: Upstash Redis REST API with in-memory fallback
- **Background Jobs & Observability**: Vercel Cron (`CRON_SECRET`), Inngest, Sentry (Node/Browser SDK)
- **Hosting**: Vercel Serverless

---

## 3. Vulnerability Findings & Remediation Log

| Vulnerability ID | Category | Severity | Status | Description & Impact (Hinglish / English) | Remediation Applied |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Cron Authorization | **Medium** | **FIXED** | *Cron route timing attack aur lax check*: `/api/cron/process-review-requests` checked `CRON_SECRET` using simple string equality (`===`) and had a loose dev condition that could permit unauthorized triggers in edge cases. | Upgraded check to use `crypto.timingSafeEqual` with strict production enforcement and generic error masking in production. |
| **SEC-002** | Error Info Leaking | **Low** | **FIXED** | *Internal DB error messages leak hone ka risk*: Catch blocks in some API routes exposed `err.message` directly in JSON responses, which could leak PostgreSQL table/column names. | Standardized generic client responses (`"Failed to process review requests"`) for production mode while keeping diagnostics for dev. |
| **SEC-003** | Env Template Drift | **Low** | **FIXED** | *Missing CRON_SECRET placeholder in template*: `.env.example` lacked the `CRON_SECRET` variable, creating confusion during production deployment. | Added `CRON_SECRET` under a dedicated `CRON & SCHEDULER SECURITY` section in `.env.example`. |
| **SEC-004** | IDOR / Tenant Isolation | **Critical (Verified)** | **SECURE** | *Cross-tenant data access*: Validated whether Merchant A could view or manipulate Merchant B's customers, offers, or rewards. | All `/api/merchant/*` endpoints strictly derive `merchantId` from `supabase.auth.getUser().id` and filter with `.eq("merchant_id", merchantId)`. IDOR is impossible. |
| **SEC-005** | Public Flow Boundary | **High (Verified)** | **SECURE** | *Customer authentication confusion*: Validated that customer QR scan flow does not require or leak merchant credentials. | Public QR flow (`/shop/[merchantId]`, `/api/shop/checkin`) is strictly decoupled from merchant admin authentication. |
| **SEC-006** | Secret Exposure Scan | **Critical (Verified)** | **SECURE** | *Git history aur frontend bundle secrets check*: Scanned git tracking and client bundles for hardcoded service role keys, DB credentials, or private keys. | Zero secrets are committed to git or exposed to `NEXT_PUBLIC_` variables. All secrets are confined to `.env.local` / `.env.staging.local`. |
| **SEC-007** | Coordinate Injection | **Medium (Verified)** | **SECURE** | *Invalid geolocation parameters*: Public endpoints accepting coordinates could receive NaN or overflow coordinates. | Handled via strict bounding: `-90 <= lat <= 90` and `-180 <= lng <= 180`. |
| **SEC-008** | Sensitive Data Redaction | **Medium (Verified)** | **SECURE** | *Log leak protection*: System logger might print bearer tokens or sensitive client details. | Logger in `@/lib/observability/logger` automatically redacts keys matching passwords, tokens, secrets, private keys, and authorization headers. |

---

## 4. 16-Dimension Audit Checklist

1. **Hardcoded Secrets**: Verified clean across all source files, git commits, and `.env.example`.
2. **Frontend Secrets Exposure**: Verified that only public anon keys and Firebase client configurations are prefixed with `NEXT_PUBLIC_`.
3. **Authentication & Session Management**: Handled via Supabase SSR HTTP-only cookies with secure token refresh in middleware.
4. **Broken Access Control & IDOR**: Verified server-side tenant scoping on every merchant route.
5. **Database Row Level Security (RLS)**: RLS policies configured across `merchants`, `customers`, `offers`, `customer_rewards`, and `review_requests`.
6. **SQL / NoSQL / Command Injection**: Handled via Supabase parameterized query builder; no raw SQL concatenation.
7. **Input Validation & Sanitization**: Strict length checks, type coercion, and schema boundaries implemented.
8. **Rate Limiting & Abuse Prevention**: Active Upstash Redis and in-memory rate limiters on auth, confirmation, checkin, and notification endpoints.
9. **CORS & CSRF**: Next.js server actions and API route headers strictly enforced; no wildcard origins on protected routes.
10. **Security Headers**: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, and `Permissions-Policy` active.
11. **Sensitive Data Exposure & Redaction**: Password hashes managed exclusively by Supabase Auth; structured logger redacts all credentials.
12. **Error Handling & Information Disclosure**: Production API routes return sanitized error messages.
13. **Dependency Security**: Core packages (Next.js 15, React 19, Supabase SSR) are up to date.
14. **File Uploads & Media Handling**: No unvalidated file uploads present.
15. **Webhooks, Cron Jobs & Background Tasks**: Protected via `CRON_SECRET` and timing-safe header validation.
16. **Business Logic & Workflow Integrity**: Reward distribution and scratch card claims require valid check-in timestamps and merchant pairing.

---

## 5. Post-Audit Manual Actions & Rotation Checklist

Before launching to production, complete these one-time manual operational tasks in the provider dashboards:

- [ ] **Rotate Supabase Service Role Key**: If previously shared or used during early local testing, regenerate the `SUPABASE_SECRET_KEY` in the Supabase Dashboard (`Project Settings > API`).
- [ ] **Configure Vercel Environment Variables**: Ensure `CRON_SECRET`, `SUPABASE_SECRET_KEY`, `FIREBASE_PRIVATE_KEY`, and `UPSTASH_REDIS_REST_TOKEN` are populated in Vercel Project Settings for Production and Preview environments.
- [ ] **Enable Supabase PITR (Point-in-Time Recovery)**: Enable automated daily backups and WAL-based point-in-time recovery on the production Supabase database.
- [ ] **Verify Firebase Cloud Messaging VAPID Key**: Ensure the public VAPID key configured matches the web push certificate in the Firebase Console.
- [ ] **Review Sentry DSN Alerts**: Configure alerting thresholds for server-side exceptions in the Sentry dashboard.

---

## 6. Pre-Launch Security Verification Checklist

- [x] All API endpoints authenticate merchant requests server-side.
- [x] Timing-safe secret verification on cron/webhook routes.
- [x] `.env.example` contains only empty placeholder strings.
- [x] Rate limiting active on all public customer endpoints.
- [x] Sensitive parameters scrubbed from structured logs.
- [x] Strict HTTP security headers returned on all pages.
- [x] TypeScript compilation (`npm run typecheck`) passes with 0 errors.
- [x] Production build (`npm run build`) completes successfully.

---

## 7. Metrics & Summary
- **Total Files Audited**: 120+ source files, configs, and scripts
- **Vulnerabilities Remediated**: 3 (1 Medium, 2 Low)
- **Zero-Day / Critical Blockers Found**: 0
- **Final Security Status**: **APPROVED FOR PRODUCTION LAUNCH**

