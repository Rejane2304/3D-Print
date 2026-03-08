
import { ProductDetailClient } from "./_components/product-detail-client";

export default async function ProductPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const resolvedParams = await params;
  return <ProductDetailClient productId={resolvedParams.id} />;
}
