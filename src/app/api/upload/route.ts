import { NextResponse } from "next/server";
import { uploadFile, deleteFile, getProvider } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "general/";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "application/pdf",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: `File type ${file.type} is not allowed` },
        { status: 400 }
      );
    }

    const result = await uploadFile(file, folder, {
      originalName: file.name,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { success: false, message: "No path provided" },
        { status: 400 }
      );
    }

    const result = await deleteFile(path);

    return NextResponse.json({ success: result });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const provider = getProvider();

  return NextResponse.json({
    success: true,
    provider,
    message: `Currently using ${provider} storage`,
  });
}
