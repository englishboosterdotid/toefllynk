import { NextResponse } from "next/server";
import {
  findAffiliateEnrollment,
  createAffiliateClick,
} from "@/lib/services/affiliateService";

export async function GET(
  req: Request,
  context: { params: Promise<{ code: string; productId: string }> }
) {
  const { code, productId } = await context.params;

  const enrollment = await findAffiliateEnrollment(code);

  if (!enrollment) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await createAffiliateClick(code, productId);

 const response = NextResponse.redirect(
  new URL(`/product/${productId}?ref=${code}`, req.url)
);

  response.cookies.set("referral_code", code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}