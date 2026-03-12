export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionId = new URL(req.url).searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const orderId = stripeSession.metadata?.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "Order reference not found" }, { status: 404 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only advance from pending — avoids overwriting an already-updated status
    if (order.status === "pending") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "paid" },
      });
    }

    const finalStatus = order.status === "pending" ? "paid" : order.status;
    return NextResponse.json({ orderId, status: finalStatus });
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
