import { NextResponse } from "next/server";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const defaultBgPath = join(process.cwd(), "public", "certificates", "sertifikat.jpg");

    if (!existsSync(defaultBgPath)) {
      return NextResponse.json({ error: "Default certificate not found" }, { status: 404 });
    }

    const buffer = readFileSync(defaultBgPath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": "attachment; filename=\"default-certificate-background.jpg\"",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Download default certificate error:", error);
    return NextResponse.json({ error: "Failed to download" }, { status: 500 });
  }
}