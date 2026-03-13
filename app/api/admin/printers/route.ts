import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const printers = await prisma.printer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ printers });
  } catch (error) {
    console.error("Error fetching printers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { orderId, orderItemId, printerId } = await req.json();
    if (orderItemId) {
      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { printerId },
      });
    } else if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { printerId },
      });
    } else {
      return NextResponse.json({ error: "Missing orderId or orderItemId" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning printer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
