import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export async function GET() {
  try {
    const user = await requireUser();

    const products = await prisma.product.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ products });
  } catch {
    return Response.json({ products: [] });
  }
}