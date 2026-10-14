import { z } from "zod";

/**
 * Common regex and primitive validators
 */
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Strict Google Maps URL validation: HTTPS only, strict host allowlist, prevents SSRF
export const googleMapsUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const parsed = new URL(val);
        if (parsed.protocol !== "https:") return false;
        const host = parsed.hostname.toLowerCase();
        return (
          host === "maps.google.com" ||
          host === "www.google.com" ||
          host === "maps.app.goo.gl" ||
          host === "goo.gl"
        );
      } catch {
        return false;
      }
    },
    { message: "Invalid Google Maps URL. Must be an https link to google.com/maps, maps.app.goo.gl, or goo.gl." }
  )
  .nullable()
  .optional();

/**
 * 1. Merchant Profile
 */
export const merchantProfileSchema = z
  .object({
    shop_name: z.string().trim().min(1, "Shop name is required.").max(100, "Shop name must be <= 100 characters."),
    owner_name: z.string().trim().max(100, "Owner name must be <= 100 characters.").nullable().optional(),
    phone: z.string().trim().regex(PHONE_REGEX, "Phone number must be 10-15 digits."),
    google_maps_url: googleMapsUrlSchema,
    slug: z.string().trim().max(100).regex(SLUG_REGEX, "Slug contains invalid characters.").optional(),
    latitude: z.union([z.number().min(-90).max(90), z.string()]).nullable().optional(),
    longitude: z.union([z.number().min(-180).max(180), z.string()]).nullable().optional(),
  })
  .strict();

/**
 * 2. Auth Routes
 */
export const signupSchema = z
  .object({
    shop_name: z.string().trim().min(1, "Shop name is required.").max(100),
    owner_name: z.string().trim().max(100).nullable().optional(),
    phone: z.string().trim().regex(PHONE_REGEX, "Phone number must be 10-15 digits."),
    email: z.string().trim().email("Invalid email address.").max(255),
    password: z.string().min(6, "Password must be at least 6 characters.").max(100),
  })
  .strict();

export const confirmUserSchema = z
  .object({
    email: z.string().trim().email("Invalid email address.").max(255),
    password: z.string().min(6).max(100),
  })
  .strict();

/**
 * 3. Shop & Customer Routes
 */
export const customerCheckinSchema = z
  .object({
    slug: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1, "Name is required.").max(100, "Name must be <= 100 characters."),
    fcmToken: z.string().trim().max(500).nullable().optional(),
    deviceToken: z.string().trim().max(100).nullable().optional(),
  })
  .strict();

export const nearbyCheckSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    slug: z.string().trim().min(1).max(100),
  })
  .strict();

export const registerTokenSchema = z
  .object({
    token: z.string().trim().min(10, "Token is too short.").max(500, "Token is too long."),
    customerId: z.string().trim().regex(UUID_REGEX, "Invalid customer UUID format."),
    slug: z.string().trim().min(1).max(100),
  })
  .strict();

/**
 * 4. Merchant Dashboard Routes
 */
export const redeemRewardSchema = z
  .object({
    code: z.string().trim().min(1, "Reward code is required.").max(50, "Invalid code length."),
  })
  .strict();

export const offerCreateOrUpdateSchema = z
  .object({
    title: z.string().trim().min(1, "Offer title is required.").max(150, "Title must be <= 150 characters."),
    message: z.string().trim().min(1, "Offer message is required.").max(1000, "Message must be <= 1000 characters."),
    image_url: z.string().trim().url().max(1000).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
    start_date: z.string().datetime().nullable().optional(),
    end_date: z.string().datetime().nullable().optional(),
  })
  .strict();

export const scratchRewardCreateOrUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Reward name is required.").max(100),
    description: z.string().trim().max(500).nullable().optional(),
    value: z.string().trim().min(1, "Reward value is required.").max(50),
    is_enabled: z.boolean().optional().default(true),
  })
  .strict();

export const automationsUpdateSchema = z
  .object({
    reengagement_enabled: z.boolean(),
    reengagement_offer_id: z.string().regex(UUID_REGEX, "Invalid offer UUID.").nullable().optional(),
  })
  .strict();

/**
 * 5. Contact / Support Route
 */
export const contactSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(100, "Name must be <= 100 characters."),
    contact_info: z.string().trim().min(1, "Contact information is required.").max(255, "Contact info must be <= 255 characters."),
    message: z.string().trim().min(1, "Message is required.").max(2000, "Message must be <= 2000 characters."),
    topic: z.string().trim().max(100).optional().default("General Inquiry"),
    business_name: z.string().trim().max(100).optional(),
  })
  .strict();

export const uuidParamSchema = z.string().regex(UUID_REGEX, "Invalid UUID parameter.");
