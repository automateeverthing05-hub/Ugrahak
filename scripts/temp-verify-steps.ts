import fs from 'node:fs';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as Sentry from '@sentry/nextjs';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function runVerification() {
  console.log('=== VERIFICATION SCRIPT START ===');

  // 1. Upstash Redis
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const pong = await redis.ping();
    console.log('STEP_4_REDIS:', pong === 'PONG' ? 'PING_PONG_SUCCESS' : 'PING_FAILED');
  } catch (err: any) {
    console.log('STEP_4_REDIS_ERROR:', err.message);
  }

  // 2. Firebase FCM Admin
  try {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n').trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
    }

    const app = getApps().length > 0 ? getApps()[0] : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    const messaging = getMessaging(app);
    // Controlled test dryRun to a dummy registration token (verifies auth without real push dispatch)
    try {
      await messaging.send(
        {
          token: 'dummy_fake_token_for_verification_testing_only_123456789012345',
          notification: { title: 'Test', body: 'Test' },
        },
        true // dryRun = true (Google server validates token & credentials without sending to any device)
      );
      console.log('STEP_5_FCM: DRY_RUN_CONTACTED_GOOGLE_SUCCESS');
    } catch (fcmErr: any) {
      const code = fcmErr.code || fcmErr.message;
      if (
        code.includes('invalid-registration-token') ||
        code.includes('registration-token-not-registered') ||
        code.includes('INVALID_ARGUMENT')
      ) {
        console.log('STEP_5_FCM: CREDENTIALS_VALID_AND_REACHED_GOOGLE (Expected invalid token response)');
      } else {
        console.log('STEP_5_FCM_ERROR:', code);
      }
    }
  } catch (err: any) {
    console.log('STEP_5_FIREBASE_INIT_ERROR:', err.message);
  }

  // 3. CRON_SECRET Endpoint Logic Check
  const cronSecretSet = Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length > 0);
  console.log('STEP_6_CRON_SECRET_EXISTS_LOCALLY:', cronSecretSet ? 'YES' : 'NO');

  // 4. Sentry Configuration Check
  const sentryDsnSet = Boolean(process.env.SENTRY_DSN && process.env.SENTRY_DSN.startsWith('http'));
  console.log('STEP_7_SENTRY_DSN_CONFIGURED:', sentryDsnSet ? 'YES_VALID_URL' : 'NO');

  console.log('=== VERIFICATION SCRIPT COMPLETE ===');
}

runVerification();

