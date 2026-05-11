import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id } = await params;
  const { ref } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      user: true,
      settings: true,
    },
  });

  if (!product) return notFound();

  // Serialize product for client component
  const serializedProduct = {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    promoPrice: product.settings?.promoPrice ?? null,
    thumbnail: product.thumbnail,
    examCredits: product.settings?.examCredits ?? 1,
    certificateIncluded: product.settings?.certificateIncluded ?? true,
    reviewIncluded: product.settings?.reviewIncluded ?? false,
    zoomIncluded: product.settings?.zoomIncluded ?? false,
    packageType: product.settings?.packageType ?? null,
    user: {
      name: product.user.name,
      username: product.user.username,
    },
    isArchived: product.settings?.isArchived ?? false,
  };

  return (
    <CheckoutClient product={serializedProduct} referral={ref} />
  );
}