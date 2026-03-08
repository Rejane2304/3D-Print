export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function POST(req) {
    try {
        const { email } = await req.json();
        if (!email)
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        const existing = await prisma.newsletter.findUnique({ where: { email } });
        if (existing)
            return NextResponse.json({ error: "Ya suscrito" }, { status: 409 });
        await prisma.newsletter.create({ data: { email } });
        return NextResponse.json({ ok: true }, { status: 201 });
    }
    catch (err) {
        console.error("Newsletter error:", err);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
