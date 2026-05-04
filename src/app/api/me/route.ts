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
      headline: true,
      bio: true,
      whatsapp: true,
      avatar: true,
      ctaText: true,
      role: true,
    },
  });

  return Response.json({ user });
}