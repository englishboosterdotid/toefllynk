import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        customDomain: true,
        domainVerified: true,
        sellerTier: true,
      },
    });

    if (!user?.customDomain) {
      return NextResponse.json({ error: "No custom domain configured" }, { status: 400 });
    }

    if (user.sellerTier !== "BUSINESS") {
      return NextResponse.json({ error: "Custom domain requires BUSINESS tier" }, { status: 403 });
    }

    if (user.domainVerified) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: "Domain already verified",
      });
    }

    // Verify TXT record
    const domainToCheck = `_toefllynk-verification.${user.customDomain}`;

    try {
      const records = await resolveTxt(domainToCheck);

      // Check if any record contains our verification marker
      const isVerified = records.some((recordArr) =>
        recordArr.some((record) => record.includes("toefllynk-verification"))
      );

      if (isVerified) {
        await prisma.user.update({
          where: { id: session.userId },
          data: {
            domainVerified: true,
            domainVerifiedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          verified: true,
          message: "Domain verified successfully!",
        });
      } else {
        return NextResponse.json({
          success: false,
          verified: false,
          message: "Verification record not found. Please add the TXT record and try again.",
        });
      }
    } catch (dnsError: any) {
      if (dnsError.code === "ENOTFOUND" || dnsError.code === "ENODATA") {
        return NextResponse.json({
          success: false,
          verified: false,
          message: "TXT record not found. Please add the DNS record and wait for propagation.",
        });
      }
      throw dnsError;
    }
  } catch (error) {
    console.error("Verify custom domain error:", error);
    return NextResponse.json({ error: "Failed to verify domain" }, { status: 500 });
  }
}