import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) return Response.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      role: true,
      profile: {
        select: {
          headline: true,
          bio: true,
          whatsapp: true,
          ctaText: true,
        },
      },
    },
  });

  if (!user) return Response.json({ user: null });

  return Response.json({
    user: {
      ...user,
      headline: user.profile?.headline,
      bio: user.profile?.bio,
      whatsapp: user.profile?.whatsapp,
      ctaText: user.profile?.ctaText,
    },
  });
}