# ApnaGrahak — Customer Retention & Loyalty SaaS for Local Merchants

**ApnaGrahak** is a customer loyalty and footfall growth platform designed specifically for local retail businesses. It allows local shop owners to convert one-time visitors into repeat loyal customers through instant QR-code check-ins, interactive scratch rewards, FCM push notification broadcasts, nearby walking-by offers (100–200m zone), and growth analytics.

---

## 🚀 Core Features

- **Merchant Authentication & Store Profile**: Email/Password merchant auth powered by Supabase Auth with unique shop URLs (`/shop/[slug]`) and counter QR code generation with download/copy actions.
- **Customer QR Enrollment (No App/Login Required)**: Customers simply scan the store counter QR code, enter their name and phone, and instantly unlock their store reward.
- **Interactive Mobile Scratch Card**: Touch/mouse HTML5 canvas scratch card with metallic gradient overlay and celebratory reveal of server-allocated rewards.
- **Repeat Visit Tracking**: Automatically tracks first-time vs repeat visits with cooldown protection against accidental duplicate clicks or page refreshes.
- **Reward Redemption Engine**: Merchant portal (`/dashboard/redeem`) to verify and redeem human-friendly reference codes (`AG-XXXX-XXXX`) with single-redemption concurrency safety and expiration enforcement.
- **Push Notification Broadcasts (FCM)**: Native browser notification permission requests and server-side multicast broadcasting to all subscribed customer devices via Firebase Admin SDK.
- **Nearby Walking-By Offers (100–200m Zone)**: Haversine distance geolocation calculation triggering exclusive walking-by offers with a strict 24-hour rate limit per customer.
- **Real Analytics & Growth Metrics**: Dashboard with 7D, 30D, 90D, and All-Time date filters computing real customer counts, repeat visit rates, reward redemption funnels, and notification delivery statistics.
- **SaaS Pricing & Plan Gating**: 4 tiers (*7-Day Free Trial*, *Starter*, *Growth*, *Pro*) with server-side customer quotas and feature limits.
- **Google Review Integration**: Direct action for customers to leave a 5-star Google Review from the reward confirmation screen.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, SSR Cookie Sessions)
- **Push Notifications**: Firebase Cloud Messaging (Web Push & Firebase Admin SDK)
- **Icons**: Lucide React
- **QR Generation**: `qrcode.react`

---

## 📁 Database Migrations

All migrations are located in `supabase/migrations/`:
1. `20260922000000_merchants_table.sql`: Merchants profile table with RLS.
2. `20260922010000_customers_and_rewards.sql`: Customers, Rewards, and Customer Visits tables with constraints and RLS.
3. `20260922020000_offers_and_notifications.sql`: Offers, Push Tokens, and Notification Delivery Logs.
4. `20260922030000_analytics_nearby_plans.sql`: Store GPS coordinates, Plan subscriptions, and Nearby Offer rate-limiting logs.

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to `.env.local` and provide your credentials:

```bash
cp .env.example .env.local
```

Required categories:
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- **Firebase Client**: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- **Firebase Admin**: `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- **App URL**: `NEXT_PUBLIC_APP_URL` (`http://localhost:3000` for development or production domain)

---

## 🏃 Local Development Commands

```bash
# Install dependencies
npm install

# Run TypeScript type check
npm run typecheck

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🚢 Vercel Deployment Instructions

1. Push code to your GitHub repository.
2. Import the repository in the **Vercel Dashboard**.
3. Under **Environment Variables**, add the variables listed in `.env.example`.
4. Ensure `NEXT_PUBLIC_APP_URL` is set to your production domain (e.g. `https://apnagrahak.vercel.app`).
5. Deploy!

