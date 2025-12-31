import { db } from "@/db";
import { userReferenceImages } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/reference-image
 * Fetch all reference images for the current user
 */
export async function GET(request: Request) {
  try {
    const session = await auth() as any;
    const userId = session?.user?.id || session?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const images = await db.query.userReferenceImages.findMany({
      where: eq(userReferenceImages.userId, userId),
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
  try {
    const session = await auth() as any;
    const userId = session?.user?.id || session?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Upload to Supabase Storage
    const imageId = nanoid();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `reference-images/${userId}/${imageId}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('profile-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-assets/${filePath}`;

    // If this is set as default, unset any existing defaults for this image type
    if (isDefault) {
      await db.update(userReferenceImages)
        .set({ isDefault: false })
        .where(eq(userReferenceImages.userId, userId));
    }

    // Insert new reference image
    const now = new Date().toISOString();

    await db.insert(userReferenceImages).values({
      imageId,
      userId: userId,
      imageUrl: publicUrl,
      imageType,
      isDefault,
      uploadedAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      imageId,
      imageUrl: publicUrl,
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
  try {
    const session = await auth() as any;
    const userId = session?.user?.id || session?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json({ error: "imageId required" }, { status: 400 });
    }

    // Verify ownership before deleting
    const image = await db.query.userReferenceImages.findFirst({
      where: eq(userReferenceImages.imageId, imageId),
    });

    if (!image || image.userId !== userId) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Attempt to delete from storage (optional, but good for cleanup)
    // Extract path from URL or reconstruct it if we followed specific naming convention
    // Since we didn't store the storage path, we might skip this or fallback to regex
    // For now, removing from DB is sufficient for the user experience.

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


