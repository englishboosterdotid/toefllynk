import { getSession } from "./session";

export async function requireUser() {
  const user = await getSession();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { id: user.userId, ...user };
}