import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as {
      id: string;
      email: string;
      username: string;
    };
  } catch {
    return null;
  }
}