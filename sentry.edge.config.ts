import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }

      if (event.request?.data) {
        event.request.data = "[REDACTED_REQUEST_DATA]";
      }

      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
      }

      return event;
    },
  });
}

