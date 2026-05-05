import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required!");
}

type SessionUser = {
  userId: string;
  email: string;
  username: string;
  name?: string | null;
  role?: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const user = jwt.verify(token, JWT_SECRET) as SessionUser;
    return user;
  } catch {
    return null;
  }
}