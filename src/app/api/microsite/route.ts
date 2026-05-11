import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import { deleteStorageFile } from "@/lib/fileCleanup";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const user = await requireUser();

    // Get current user to check for avatar cleanup
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    });

    const avatar = formData.get("avatar") as string || null;

    // Update User.avatar only
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar },
    });

    // Update SellerProfile for microsite fields
    await prisma.sellerProfile.update({
      where: { userId: user.id },
      data: {
        headline: formData.get("headline") as string || null,
        bio: formData.get("bio") as string || null,
        whatsapp: formData.get("whatsapp") as string || null,
        ctaText: formData.get("ctaText") as string || null,
      },
    });

    // Clean up old avatar if changed
    if (currentUser?.avatar && currentUser.avatar !== avatar) {
      await deleteStorageFile(currentUser.avatar);
    }

    return Response.redirect(new URL("/user/microsite?success=1", req.url));
  } catch (error: any) {
    console.error("Microsite update error:", error);
    return Response.json({ success: false, message: error.message });
  }
}