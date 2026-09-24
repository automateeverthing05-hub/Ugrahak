import { Inngest } from "inngest";

// Initialize Inngest client for Ugrahak SaaS background operations
export const inngest = new Inngest({
  id: "ugrahak-saas",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

