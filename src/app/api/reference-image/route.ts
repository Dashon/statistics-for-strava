import { db } from "@/db";
import { userReferenceImages } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/reference-image
 * Fetch all reference images for the current user
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const images = await db.query.userReferenceImages.findMany({
      where: eq(userReferenceImages.userId, session.user.id),
    });

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error("Error fetching reference images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/reference-image
 * Upload a new reference image for AI thumbnail generation
 *
 * Body: FormData with:
 * - file: Image file
 * - imageType: 'running' | 'cycling' | 'general'
 * - isDefault: boolean
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const imageType = formData.get("imageType") as string || "general";
    const isDefault = formData.get("isDefault") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Convert file to base64 or upload to storage service
    // For now, we'll store as base64 (in production, use S3, Supabase Storage, etc.)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const imageUrl = `data:${file.type};base64,${base64}`;

    // If this is set as default, unset any existing defaults for this image type
    if (isDefault) {
      await db.update(userReferenceImages)
        .set({ isDefault: false })
        .where(eq(userReferenceImages.userId, session.user.id));
    }

    // Insert new reference image
    const imageId = nanoid();
    const now = new Date().toISOString();

    await db.insert(userReferenceImages).values({
      imageId,
      userId: session.user.id,
      imageUrl,
      imageType,
      isDefault,
      uploadedAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      imageId,
      message: "Reference image uploaded successfully",
    });

  } catch (error: any) {
    console.error("Error uploading reference image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/reference-image?imageId=xxx
 * Delete a reference image
 */
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json({ error: "imageId required" }, { status: 400 });
    }

    // Verify ownership before deleting
    const image = await db.query.userReferenceImages.findFirst({
      where: eq(userReferenceImages.imageId, imageId),
    });

    if (!image || image.userId !== session.user.id) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await db.delete(userReferenceImages)
      .where(eq(userReferenceImages.imageId, imageId));

    return NextResponse.json({
      success: true,
      message: "Reference image deleted successfully",
    });

  } catch (error: any) {
    console.error("Error deleting reference image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
