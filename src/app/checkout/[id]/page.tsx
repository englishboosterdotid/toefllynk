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
    },
  });

  if (!product) return notFound();

  // Serialize product for client component
  const serializedProduct = {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    promoPrice: product.promoPrice,
    thumbnail: product.thumbnail,
    examCredits: product.examCredits,
    certificateIncluded: product.certificateIncluded,
    reviewIncluded: product.reviewIncluded,
    zoomIncluded: product.zoomIncluded,
    packageType: product.packageType,
    user: {
      name: product.user.name,
      username: product.user.username,
    },
    isArchived: product.isArchived,
  };

  return (
    <CheckoutClient product={serializedProduct} ref={ref} />
  );
}