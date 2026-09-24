import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const rateLimitCounter = new Counter('rate_limited_requests');
export const successRate = new Rate('success_rate');
export const errorRate = new Rate('error_rate');

export const http2xxCounter = new Counter('http_2xx_requests');
export const http4xxCounter = new Counter('http_4xx_requests');
export const http429Counter = new Counter('http_429_requests');
export const http5xxCounter = new Counter('http_5xx_requests');
export const timeoutCounter = new Counter('timeout_requests');
export const connectionErrorCounter = new Counter('connection_error_requests');

export const checkinTrend = new Trend('checkin_duration', true);
export const shopViewTrend = new Trend('shop_view_duration', true);
export const nearbyTrend = new Trend('nearby_duration', true);
export const customerDashTrend = new Trend('customer_dash_duration', true);
export const offersTrend = new Trend('offers_duration', true);
export const analyticsTrend = new Trend('analytics_duration', true);

const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const TOTAL_MERCHANTS = 1000;
const TOTAL_CUSTOMERS = 100000;

export const options = {
  vus: parseInt(__ENV.VUS || '100', 10),
  duration: __ENV.DURATION || '5m',
};

function getRandomMerchantIndex() {
  return Math.floor(Math.random() * TOTAL_MERCHANTS) + 1;
}

function getRandomCustomerIndex() {
  return Math.floor(Math.random() * TOTAL_CUSTOMERS) + 1;
}

function getMerchantSlug(index) {
  return `test-merchant-${String(index).padStart(6, '0')}`;
}

function recordResponse(res, trend) {
  if (trend) {
    trend.add(res.timings.duration);
  }

  const s = res.status;
  if (s >= 200 && s < 300) {
    http2xxCounter.add(1);
    successRate.add(1);
  } else if (s === 429) {
    http4xxCounter.add(1);
    http429Counter.add(1);
    rateLimitCounter.add(1);
    successRate.add(1); // 429 is expected controlled rate-limiting under load
  } else if (s >= 400 && s < 500) {
    http4xxCounter.add(1);
    if (s === 404 || s === 401) {
      successRate.add(1);
    } else {
      errorRate.add(1);
    }
  } else if (s >= 500) {
    http5xxCounter.add(1);
    errorRate.add(1);
  } else if (s === 0) {
    if (res.error && res.error.toLowerCase().includes('timeout')) {
      timeoutCounter.add(1);
    } else {
      connectionErrorCounter.add(1);
    }
    errorRate.add(1);
  }
}

export default function () {
  const mIndex = getRandomMerchantIndex();
  const cIndex = getRandomCustomerIndex();
  const slug = getMerchantSlug(mIndex);
  const existingPhone = `98${String(cIndex).padStart(8, '0')}`;
  const newPhone = `97${String(Math.floor(Math.random() * 90000000) + 10000000)}`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'k6-load-test/1.0 (Ugrahak-Staging-Step6)',
    },
    tags: { name: 'unspecified' },
  };

  // Realistic Traffic Distribution:
  // 35% Customer Check-ins (Strong consistency write path)
  // 20% Public Shop Page (ISR cached storefront)
  // 15% Nearby Radar Check (Spatial bounding box query)
  // 10% Customer Dashboard (Merchant dashboard customer view)
  // 10% Offers / Broadcast reads (Offer catalog lookup)
  // 10% Analytics / Dashboard reads (Analytics overview)
  const rand = Math.random();

  if (rand < 0.35) {
    // 35% Customer Check-ins
    const isNew = Math.random() < 0.2;
    const checkinPayload = JSON.stringify({
      slug: slug,
      name: isNew ? `New Load Customer ${cIndex}` : `Repeat Customer ${cIndex}`,
      phone: isNew ? newPhone : existingPhone,
    });

    params.tags.name = 'POST /api/shop/checkin';
    const res = http.post(`${TARGET_URL}/api/shop/checkin`, checkinPayload, params);
    recordResponse(res, checkinTrend);

    check(res, {
      'checkin valid (200, 201, or 429)': (r) => [200, 201, 429].includes(r.status),
    });

  } else if (rand < 0.55) {
    // 20% Public Shop Page
    params.tags.name = 'GET /shop/[slug]';
    const res = http.get(`${TARGET_URL}/shop/${slug}`, {
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
      tags: params.tags,
    });
    recordResponse(res, shopViewTrend);

    check(res, {
      'shop page valid (200 or 429)': (r) => [200, 429].includes(r.status),
    });

  } else if (rand < 0.70) {
    // 15% Nearby Radar Checks
    const lat = 28.6139 + (Math.random() - 0.5) * 0.02;
    const lon = 77.2090 + (Math.random() - 0.5) * 0.02;

    const nearbyPayload = JSON.stringify({
      slug: slug,
      latitude: lat,
      longitude: lon,
    });

    params.tags.name = 'POST /api/shop/nearby-check';
    const res = http.post(`${TARGET_URL}/api/shop/nearby-check`, nearbyPayload, params);
    recordResponse(res, nearbyTrend);

    check(res, {
      'nearby valid (200 or 429)': (r) => [200, 429].includes(r.status),
    });

  } else if (rand < 0.80) {
    // 10% Customer Dashboard
    params.tags.name = 'GET /dashboard/customers';
    const res = http.get(`${TARGET_URL}/dashboard/customers`, {
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
      tags: params.tags,
    });
    recordResponse(res, customerDashTrend);

    check(res, {
      'customer dashboard valid (200, 307, or 429)': (r) => [200, 307, 429].includes(r.status),
    });

  } else if (rand < 0.90) {
    // 10% Offers / Broadcast reads
    params.tags.name = 'GET /dashboard/offers';
    const res = http.get(`${TARGET_URL}/dashboard/offers`, {
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
      tags: params.tags,
    });
    recordResponse(res, offersTrend);

    check(res, {
      'offers valid (200, 307, or 429)': (r) => [200, 307, 429].includes(r.status),
    });

  } else {
    // 10% Analytics / Dashboard reads
    params.tags.name = 'GET /dashboard/analytics';
    const res = http.get(`${TARGET_URL}/dashboard/analytics`, {
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
      tags: params.tags,
    });
    recordResponse(res, analyticsTrend);

    check(res, {
      'analytics valid (200, 307, or 429)': (r) => [200, 307, 429].includes(r.status),
    });
  }

  // Realistic user think time between requests (200ms - 800ms)
  sleep(0.2 + Math.random() * 0.6);
}
