import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      }),
      prisma.pointsTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      currentPoints: user?.loyaltyPoints || 0,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching points:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
