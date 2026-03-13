export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const paramsObj = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { rating, comment } = body ?? {};
    if (!rating || !comment)
      return NextResponse.json({ error: "Rating and comment required" }, { status: 400 });
    const userId = (session.user as Record<string, unknown>)?.id as string;
    const review = await prisma.review.create({
      data: {
        userId,
        productId: paramsObj.id,
        rating: Math.min(5, Math.max(1, rating)),
        comment,
      },
      include: { user: { select: { name: true, email: true } } },
    });
    const agg = await prisma.review.aggregate({
      where: { productId: paramsObj.id },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: paramsObj.id },
      data: { rating: agg?._avg?.rating ?? 0, reviewCount: agg?._count ?? 0 },
    });
    return NextResponse.json(review, { status: 201 });
  } catch (err: unknown) {
    console.error("Review error:", err);
    return NextResponse.json({ error: "Error creating review" }, { status: 500 });
  }
}
