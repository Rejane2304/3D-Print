import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { sendEmail, tplReadyToShip, tplShipped } from "@/lib/email";
export const dynamic = "force-dynamic";
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
async function maybeNotifyCustomer(order, newStatus) {
  const email = order.shippingEmail;
  if (!email) return;
  const name = order.shippingName || "Cliente";
  if (newStatus === "ready") {
    await sendEmail(
      email,
      "¡Tu pedido está listo para el envío!",
      tplReadyToShip(name, order.id, order.total),
    );
  } else if (newStatus === "shipped") {
    const address = [
      order.shippingAddress,
      order.shippingCity,
      order.shippingState,
      order.shippingZip,
      order.shippingCountry,
    ]
      .filter((v) => Boolean(v))
      .join(", ");
    await sendEmail(
      email,
      "¡Tu pedido ha sido enviado!",
      tplShipped(name, order.id, address),
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
    const { status } = await request.json();
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
    });
    await maybeNotifyCustomer(order, status).catch((err) =>
      console.error("Email notification error:", err),
    );
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
