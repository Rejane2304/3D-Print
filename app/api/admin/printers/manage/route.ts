import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const PRINTER_STATUSES = ["available", "busy", "maintenance"] as const;

type PrinterStatus = (typeof PRINTER_STATUSES)[number];

function isAdmin(session: Session | null) {
  return !!(session?.user && (session.user as { role?: string }).role === "admin");
}

function parseStatus(value: unknown): PrinterStatus {
  if (typeof value === "string" && PRINTER_STATUSES.includes(value as PrinterStatus)) {
    return value as PrinterStatus;
  }
  return "available";
}

function parseString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const name = parseString(payload.name);
  if (!name) {
    return NextResponse.json(
      { error: "El nombre de la impresora es obligatorio" },
      { status: 400 }
    );
  }

  const printer = await prisma.printer.create({
    data: {
      name,
      location: parseString(payload.location),
      status: parseStatus(payload.status),
    },
  });
  return NextResponse.json(printer, { status: 201 });
}
