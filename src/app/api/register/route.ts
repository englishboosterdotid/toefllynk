import { register } from "@/lib/services/authService";
import { z } from "zod";
import { isReservedUsername } from "@/lib/constants";
import { userRepository } from "@/lib/repositories";

const RegisterSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter").max(100, "Nama harus maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  username: z.string()
    .min(3, "Username harus minimal 3 karakter")
    .max(50, "Username harus maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore")
    .refine((val) => !isReservedUsername(val), {
      message: "Username ini tidak tersedia",
    }),
  password: z.string()
    .min(8, "Password harus minimal 8 karakter")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] || "Data tidak valid";
      return Response.json({ success: false, message: firstError }, { status: 400 });
    }

    const { name, email, username, password } = validation.data;

    // Check email existence
    const existingEmail = await userRepository.checkEmailExists(email);
    if (existingEmail) {
      return Response.json({ success: false, message: "Email sudah dipakai" }, { status: 409 });
    }

    // Check username existence
    const existingUsername = await userRepository.checkUsernameExists(username);
    if (existingUsername) {
      return Response.json({ success: false, message: "Username sudah dipakai" }, { status: 409 });
    }

    // Use authService.register() for actual registration
    const result = await register(name, email, password, username);

    if (!result.success) {
      return Response.json({ success: false, message: result.error }, { status: 400 });
    }

    return Response.json({ success: true, message: "Registrasi berhasil" });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ success: false, message: "Register gagal" }, { status: 500 });
  }
}