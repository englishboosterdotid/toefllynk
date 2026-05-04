import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const user = await requireUser();

    const data = {
      headline: formData.get("headline") as string || null,
      bio: formData.get("bio") as string || null,
      whatsapp: formData.get("whatsapp") as string || null,
      avatar: formData.get("avatar") as string || null,
      ctaText: formData.get("ctaText") as string || null,
    };

    await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return Response.redirect(new URL("/user/microsite?success=1", req.url));
  } catch (error: any) {
    console.error("Microsite update error:", error);
    return Response.json({ success: false, message: error.message });
  }
}