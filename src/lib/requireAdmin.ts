import { getSession } from "./session";
import prisma from "./prisma";

export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return user;
}