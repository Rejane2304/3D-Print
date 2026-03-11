import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const PRINTER_STATUSES = ["available", "busy", "maintenance"] as const;

type PrinterStatus = (typeof PRINTER_STATUSES)[number];

function isAdmin(session: Session | null) {
  return !!(
    session?.user && (session.user as { role?: string }).role === "admin"
  );
}

function parseStatus(value: unknown): PrinterStatus | undefined {
  if (
    typeof value === "string" &&
    PRINTER_STATUSES.includes(value as PrinterStatus)
  ) {
    return value as PrinterStatus;
  }
  return undefined;
}

function parseString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  const name = parseString(payload.name);
  if (name) data.name = name;
  const location = parseString(payload.location);
  if (location !== undefined) data.location = location;
  const status = parseStatus(payload.status);
  if (status) data.status = status;

  if (!Object.keys(data).length) {
    return NextResponse.json(
      { error: "No se proporcionaron campos válidos" },
      { status: 400 },
    );
  }

  try {
    const printer = await prisma.printer.update({
      where: { id },
      data,
    });
    return NextResponse.json(printer);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Impresora no encontrada" },
        { status: 404 },
      );
    }
    console.error("Error actualizando impresora:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.printer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Impresora no encontrada" },
        { status: 404 },
      );
    }
    console.error("Error eliminando impresora:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
