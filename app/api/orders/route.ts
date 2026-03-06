export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ orders: [] });
    const userId = (session.user as Record<string, unknown>)?.id as string;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (err: unknown) {
    console.error("Orders fetch error:", err);
    return NextResponse.json({ orders: [] });
  }
}
