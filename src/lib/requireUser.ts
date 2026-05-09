import { getSession } from "./session";
import { userRepository } from "@/lib/repositories";

export async function requireUser() {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Get full user data including sellerTier
  const user = await userRepository.findById(session.userId);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}