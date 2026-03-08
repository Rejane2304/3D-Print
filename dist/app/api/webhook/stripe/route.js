export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
export async function POST(req) {
    try {
        const body = await req.json();
        const event = body;
        if (event?.type === "checkout.session.completed") {
            const sessionData = event?.data?.object;
            const orderId = sessionData?.metadata?.orderId;
            const couponId = sessionData?.metadata?.couponId;
            if (orderId) {
                const order = await prisma.order.update({
                    where: { id: orderId },
                    data: { status: "paid" },
                });
                // Incrementar usedCount del cupón si se usó uno
                if (couponId) {
                    await prisma.coupon
                        .update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } })
                        .catch((err) => console.error("Error updating coupon usedCount:", err));
                }
                // Otorgar puntos de fidelidad (1 punto por euro gastado, sobre total con descuento)
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
    }
    catch (err) {
        console.error("Webhook error:", err);
        return NextResponse.json({ error: "Webhook error" }, { status: 500 });
    }
}
