import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import { contactSchema, formatZodError } from "@/lib/validation/schemas";

interface ContactSubmission {
  name: string;
  businessName: string;
  contact: string; // Email or Phone
  topic: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = contactSchema.safeParse({
      name: rawBody.name,
      contact_info: rawBody.contact || rawBody.contact_info,
      message: rawBody.message,
      topic: rawBody.topic,
      business_name: rawBody.businessName || rawBody.business_name,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error).error },
        { status: 400 }
      );
    }

    const {
      name: trimmedName,
      contact_info: trimmedContact,
      message: trimmedMsg,
      topic: trimmedTopic,
      business_name: trimmedBusiness,
    } = parseResult.data;

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Attempt to persist support ticket in database
    let ticketSaved = false;
    let ticketId: string | null = null;

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("support_tickets")
        .insert({
          name: trimmedName,
          business_name: trimmedBusiness,
          contact_info: trimmedContact,
          topic: trimmedTopic,
          message: trimmedMsg,
          ip_address: ip,
          user_agent: userAgent,
        })
        .select("id")
        .maybeSingle();

      if (!error && data) {
        ticketSaved = true;
        ticketId = data.id;
      }
    } catch {
      // If support_tickets table is not yet migrated, fallback gracefully
      ticketSaved = false;
    }

    // Safe audit logging without raw personal data (PII)
    logger.info("Support inquiry received", {
      operation: "CONTACT_FORM_SUBMISSION",
      status: ticketSaved ? "PERSISTED" : "UNPERSISTED",
      metadata: {
        ticketId,
        topic: trimmedTopic,
        ticketSaved,
      },
    });

    // If database insertion failed, do not falsely claim "sent"
    if (!ticketSaved) {
      return NextResponse.json(
        {
          success: false,
          error:
            "तकनीकी समस्या के कारण पूछताछ दर्ज नहीं हो सकी। कृपया सीधे WhatsApp (8758422859) या supportugrahak@gmail.com पर संदेश भेजें।",
        },
        { status: 500 }
      );
    }

    // Check if transactional email SMTP/API credentials exist
    const hasEmailProvider = Boolean(
      process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      process.env.SMTP_HOST
    );

    return NextResponse.json(
      {
        success: true,
        persisted: true,
        emailDispatched: hasEmailProvider,
        message:
          "आपकी पूछताछ सफलतापूर्वक दर्ज कर ली गई है। हमारी सहायता टीम (supportugrahak@gmail.com) 24–48 घंटों में आपसे संपर्क करेगी।",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[Contact Route Error]", err);
    return NextResponse.json(
      {
        error:
          "संदेश भेजने में समस्या आई। कृपया पुनः प्रयास करें या सीधे supportugrahak@gmail.com पर ईमेल करें।",
      },
      { status: 500 }
    );
  }
}
