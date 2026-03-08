import { ProductDetailClient } from "./_components/product-detail-client";
export default function ProductPage({ params }) {
    return <ProductDetailClient productId={params?.id ?? ""}/>;
}
