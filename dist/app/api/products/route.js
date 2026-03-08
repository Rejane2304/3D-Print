export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function GET(req) {
    try {
        const url = new URL(req.url);
        const search = url.searchParams.get("search") ?? "";
        const material = url.searchParams.get("material") ?? "";
        const category = url.searchParams.get("category") ?? "";
        const sort = url.searchParams.get("sort") ?? "newest";
        const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
        const limit = Number.parseInt(url.searchParams.get("limit") ?? "12", 10);
        const featured = url.searchParams.get("featured");
        const where = {};
        if (search)
            where.name = { contains: search, mode: "insensitive" };
        if (material)
            where.material = material;
        if (category) {
            const map = {
                Accesorios: ["Accesorios", "Accesorio"],
                Decoracion: ["Decoracion"],
                Figuras: ["Figuras", "Figura"],
                Funcional: ["Funcional", "Funcionales"],
                Articulados: ["Articulados", "Articulado"],
            };
            const values = map[category] ?? [category];
            where.category = { in: values };
        }
        if (featured === "true")
            where.featured = true;
        const orderBy = {};
        if (sort === "price_asc")
            orderBy.basePricePerGram = "asc";
        else if (sort === "price_desc")
            orderBy.basePricePerGram = "desc";
        else if (sort === "rating")
            orderBy.rating = "desc";
        else
            orderBy.createdAt = "desc";
        const [products, total] = await Promise.all([
            prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
            prisma.product.count({ where }),
        ]);
        return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
    }
    catch (err) {
        console.error("Products fetch error:", err);
        return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
    }
}
