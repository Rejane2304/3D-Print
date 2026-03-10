export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
export async function GET(_req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user?.id;
    const order = await prisma.order.findFirst({
      where: { id: params?.id ?? "", userId },
      include: { items: true },
    });
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    console.error("Order fetch error:", err);
    return NextResponse.json(
      { error: "Error fetching order" },
      { status: 500 },
    );
  }
}
