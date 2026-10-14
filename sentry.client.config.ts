import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      // 1. Redact authorization headers & cookies
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }

      // 2. Scrub request payload bodies if captured
      if (event.request?.data) {
        event.request.data = "[REDACTED_REQUEST_DATA]";
      }

      // 3. Scrub user object identifiers
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
      }

      return event;
    },
  });
}

