import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const seen = searchParams.get("seen");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (seen === "true") where.seen = true;
    else if (seen === "false") where.seen = false;

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.alert.count({ where }),
    ]);

    return NextResponse.json({ alerts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, seen } = await req.json();
    await prisma.alert.update({
      where: { id },
      data: { seen: !!seen },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
