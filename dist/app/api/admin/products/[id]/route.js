import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const data = await request.json();
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        material: data.material,
        basePricePerGram: Number.parseFloat(data.basePricePerGram),
        density: Number.parseFloat(data.density),
        minDimX: Number.parseFloat(data.minDimX),
        minDimY: Number.parseFloat(data.minDimY),
        minDimZ: Number.parseFloat(data.minDimZ),
        maxDimX: Number.parseFloat(data.maxDimX),
        maxDimY: Number.parseFloat(data.maxDimY),
        maxDimZ: Number.parseFloat(data.maxDimZ),
        defaultDimX: Number.parseFloat(data.defaultDimX),
        defaultDimY: Number.parseFloat(data.defaultDimY),
        defaultDimZ: Number.parseFloat(data.defaultDimZ),
        finishCost: Number.parseFloat(data.finishCost),
        printTimeMinutes: Number.parseInt(data.printTimeMinutes || "60"),
        modelFillFactor: Number.parseFloat(data.modelFillFactor || "0.15"),
        images: data.images,
        colors: data.colors,
        featured: data.featured,
        stock: Number.parseInt(data.stock),
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
