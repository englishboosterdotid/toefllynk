import prisma from "./prisma";
import { getCurrentUser } from "./getUser";

export async function getAdminUser() {
  const session = await getCurrentUser();

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}