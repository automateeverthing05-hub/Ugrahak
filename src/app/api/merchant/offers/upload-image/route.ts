import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/merchant/offers/upload-image
 * Authenticated merchant uploads an offer/product image directly.
 * Stores image in Supabase Storage under `offers/{merchantId}/{timestamp}_{random}.ext`
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in as a merchant." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No image file provided. Please select or capture an image." },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image size exceeds the 5MB limit. Please upload a smaller image." },
        { status: 400 }
      );
    }

    // Validate mime type
    const mimeType = file.type?.toLowerCase();
    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP." },
        { status: 400 }
      );
    }

    // Determine extension
    let extension = "jpg";
    if (mimeType === "image/png") extension = "png";
    else if (mimeType === "image/webp") extension = "webp";
    else if (mimeType === "image/jpeg" || mimeType === "image/jpg") extension = "jpg";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify basic image magic numbers for security
    const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp = buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isPng && !isJpg && !isWebp) {
      return NextResponse.json(
        { error: "Invalid image file header. Please upload a valid PNG, JPG, or WEBP image." },
        { status: 400 }
      );
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `${user.id}/${uniqueId}.${extension}`;

    const admin = createAdminClient();

    // Ensure bucket exists
    const { error: uploadError } = await admin.storage
      .from("offers")
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      logger.error("Failed to upload offer image to storage", {
        operation: "OFFER_IMAGE_UPLOAD",
        merchantId: user.id,
        durationMs: Date.now() - start,
      }, uploadError);

      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = admin.storage
      .from("offers")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      storagePath,
    });
  } catch (err: unknown) {
    logger.error("Unexpected error in offer image upload", {
      operation: "OFFER_IMAGE_UPLOAD",
      durationMs: Date.now() - start,
    }, err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error during upload." },
      { status: 500 }
    );
  }
}

