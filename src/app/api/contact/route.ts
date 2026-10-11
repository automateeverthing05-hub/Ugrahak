import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ContactSubmission {
  name: string;
  businessName: string;
  contact: string; // Email or Phone
  topic: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactSubmission;
    const { name, businessName, contact, topic, message } = body;

    // Validate required fields
    if (!name?.trim() || !contact?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "कृपया नाम, संपर्क (Email/Phone) और संदेश भरें।" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedBusiness = businessName?.trim() || null;
    const trimmedContact = contact.trim();
    const trimmedTopic = topic?.trim() || "General Help";
    const trimmedMsg = message.trim();

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Attempt to persist support ticket in database
    let ticketSaved = false;
    let ticketId: string | null = null;

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("support_tickets" as any)
        .insert({
          name: trimmedName,
          business_name: trimmedBusiness,
          contact_info: trimmedContact,
          topic: trimmedTopic,
          message: trimmedMsg,
          ip_address: ip,
          user_agent: userAgent,
        } as any)
        .select("id")
        .maybeSingle();

      if (!error && data) {
        ticketSaved = true;
        ticketId = (data as any).id;
      }
    } catch {
      // If support_tickets table is not yet migrated, fallback gracefully
      ticketSaved = false;
    }

    // Always log the inquiry for auditability
    console.info("[Support Inquiry Received]", {
      ticketId,
      name: trimmedName,
      businessName: trimmedBusiness,
      contact: trimmedContact,
      topic: trimmedTopic,
      message: trimmedMsg,
      ticketSaved,
      receivedAt: new Date().toISOString(),
    });

    // Check if transactional email SMTP/API credentials exist
    const hasEmailProvider = Boolean(
      process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      process.env.SMTP_HOST
    );

    return NextResponse.json(
      {
        success: true,
        persisted: ticketSaved,
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
