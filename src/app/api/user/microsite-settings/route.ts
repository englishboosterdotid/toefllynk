import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TierService } from "@/lib/services/TierService";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.micrositeSettings.findUnique({
      where: { userId: session.userId },
    });

    // Get featured products count
    const featuredCount = await prisma.product.count({
      where: { userId: session.userId, settings: { isFeatured: true } },
    });

    const tierInfo = await TierService.getUserTierInfo(session.userId);

    return NextResponse.json({
      settings,
      featuredCount,
      access: {
        canCustomizeFooterHeader: tierInfo.tierConfig.hasCustomFooterHeader,
        canRemoveLynkLogo: tierInfo.tierConfig.hasRemoveLynkLogo,
        canCustomTheme: tierInfo.tierConfig.customThemeLevel > 0,
        canFullTheme: tierInfo.tierConfig.customThemeLevel === 2,
        canFeaturedProducts: tierInfo.tierConfig.hasFeaturedProducts,
        currentTier: tierInfo.tier,
      },
    });
  } catch (error) {
    console.error("Get microsite settings error:", error);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const tierInfo = await TierService.getUserTierInfo(session.userId);

    // Check feature access
    if (body.customHeaderHtml !== undefined || body.customFooterHtml !== undefined) {
      if (!tierInfo.tierConfig.hasCustomFooterHeader) {
        return NextResponse.json(
          { error: "Custom footer/header requires BUSINESS tier" },
          { status: 403 }
        );
      }
    }

    if (body.removeLynkLogo !== undefined) {
      if (!tierInfo.tierConfig.hasRemoveLynkLogo) {
        return NextResponse.json(
          { error: "Remove Lynk logo requires BUSINESS tier" },
          { status: 403 }
        );
      }
    }

    // Theme customization access check
    if (body.primaryColor !== undefined || body.themeMode !== undefined) {
      if (tierInfo.tierConfig.customThemeLevel === 0) {
        return NextResponse.json(
          { error: "Theme customization requires PRO or BUSINESS tier" },
          { status: 403 }
        );
      }
    }

    // Full theme (custom CSS, secondary/accent colors) - BUSINESS only
    if (body.customCss !== undefined || body.secondaryColor !== undefined || body.accentColor !== undefined || body.fontFamily !== undefined) {
      if (tierInfo.tierConfig.customThemeLevel < 2) {
        return NextResponse.json(
          { error: "Advanced theme customization requires BUSINESS tier" },
          { status: 403 }
        );
      }
    }

    const settingsData: Record<string, unknown> = {};

    // BASIC theme (PRO)
    if (tierInfo.tierConfig.customThemeLevel > 0) {
      settingsData.themeMode = body.themeMode ?? "light";
      settingsData.primaryColor = body.primaryColor ?? "#3b82f6";
    }

    // FULL theme (BUSINESS)
    if (tierInfo.tierConfig.customThemeLevel >= 2) {
      settingsData.secondaryColor = body.secondaryColor ?? null;
      settingsData.accentColor = body.accentColor ?? null;
      settingsData.fontFamily = body.fontFamily ?? "Inter";
      settingsData.customCss = body.customCss ?? null;
    }

    // Footer/header & branding (BUSINESS)
    if (tierInfo.tierConfig.hasCustomFooterHeader) {
      settingsData.customHeaderHtml = body.customHeaderHtml;
      settingsData.showDefaultHeader = body.showDefaultHeader ?? true;
      settingsData.customFooterHtml = body.customFooterHtml;
      settingsData.showDefaultFooter = body.showDefaultFooter ?? true;
      settingsData.footerText = body.footerText;
    }

    if (tierInfo.tierConfig.hasRemoveLynkLogo) {
      settingsData.removeLynkLogo = body.removeLynkLogo ?? false;
      settingsData.showPoweredBy = body.showPoweredBy ?? true;
    }

    // Social & contact (available to all) - only set if provided
    if (body.socialInstagram !== undefined) settingsData.socialInstagram = body.socialInstagram || null;
    if (body.socialFacebook !== undefined) settingsData.socialFacebook = body.socialFacebook || null;
    if (body.socialTwitter !== undefined) settingsData.socialTwitter = body.socialTwitter || null;
    if (body.socialYoutube !== undefined) settingsData.socialYoutube = body.socialYoutube || null;
    if (body.socialTiktok !== undefined) settingsData.socialTiktok = body.socialTiktok || null;
    if (body.socialLinkedin !== undefined) settingsData.socialLinkedin = body.socialLinkedin || null;
    if (body.contactEmail !== undefined) settingsData.contactEmail = body.contactEmail || null;
    if (body.contactPhone !== undefined) settingsData.contactPhone = body.contactPhone || null;
    if (body.contactAddress !== undefined) settingsData.contactAddress = body.contactAddress || null;

    const settings = await prisma.micrositeSettings.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        ...settingsData,
      },
      update: settingsData,
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Update microsite settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}