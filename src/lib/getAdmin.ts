import { getCurrentUser } from "./services/authService";

export async function getAdminUser() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}
