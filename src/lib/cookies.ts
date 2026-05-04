import { cookies } from "next/headers";

export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  
  let domain: string | undefined;
  try {
    if (appUrl) {
      const url = new URL(appUrl);
      domain = url.hostname;
    }
  } catch {}

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    domain: isProduction && domain && domain !== "localhost" ? domain : undefined,
  };
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, getCookieOptions());
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("token");
}

export async function setStudentCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("student_token", token, getCookieOptions());
}

export async function deleteStudentCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("student_token");
}
