import { getSession } from "./session";

export async function requireAdmin() {
  const user = await getSession();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }

  return { id: user.userId, ...user };
}
