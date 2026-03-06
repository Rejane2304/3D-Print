export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body;
    if (event?.type === "checkout.session.completed") {
      const sessionData = event?.data?.object;
      const orderId = sessionData?.metadata?.orderId;
      if (orderId) {
        // Update order status
        const order = await prisma.order.update({
          where: { id: orderId },
          data: { status: "paid" },
        });

        // Award loyalty points (1 point per euro spent)
        const pointsToAward = Math.floor(order.total);
        if (pointsToAward > 0 && order.userId) {
          await prisma.user.update({
            where: { id: order.userId },
            data: { loyaltyPoints: { increment: pointsToAward } },
          });

          await prisma.pointsTransaction.create({
            data: {
              userId: order.userId,
              points: pointsToAward,
              type: "earned",
              description: `Puntos por pedido #${order.id.slice(-8).toUpperCase()}`,
              orderId: order.id,
            },
          });
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
