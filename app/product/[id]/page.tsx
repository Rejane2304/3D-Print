import { ProductDetailClient } from "./_components/product-detail-client";

export default function ProductPage({ params }: Readonly<{ params: { id: string } }>) {
  return <ProductDetailClient productId={params?.id ?? ""} />;
}
