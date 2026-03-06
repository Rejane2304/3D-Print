import { ProductDetailClient } from "./_components/product-detail-client";

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductDetailClient productId={params?.id ?? ""} />;
}
