// =============================================================
// Servicio de email transaccional — Nodemailer + SMTP genérico
// Configura las variables de entorno EMAIL_* para activarlo.
// Sin configuración: los mensajes se loguean en consola (no-op).
// =============================================================

import nodemailer from "nodemailer";

function getTransporter() {
  if (!process.env.EMAIL_SERVER_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: process.env.EMAIL_SERVER_SECURE === "true",
    auth: {
      user: process.env.EMAIL_SERVER_USER ?? "",
      pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject} (EMAIL_SERVER_HOST no configurado)`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "noreply@3dprint.es",
    to,
    subject,
    html,
  });
}

// ---- Plantillas ----------------------------------------------

export function tplReadyToShip(name: string, orderId: string, total: number): string {
  const ref = orderId.slice(-8).toUpperCase();
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;border-radius:12px;overflow:hidden">
  <div style="background:#111;padding:24px;border-bottom:2px solid #00FFFF">
    <h1 style="margin:0;color:#00FFFF;font-size:22px">🎉 ¡Tu pedido está listo para el envío!</h1>
  </div>
  <div style="padding:24px">
    <p>Hola <strong>${name}</strong>,</p>
    <p>Nos complace informarte que tu pedido <strong>#${ref}</strong> ha finalizado su producción
       y está listo para ser enviado.</p>
    <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin:16px 0">
      <p style="margin:0;font-size:14px;color:#aaa">Referencia de pedido</p>
      <p style="margin:4px 0 0;font-size:18px;font-family:monospace;color:#00FFFF">#${ref}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#aaa">Total: <strong style="color:#e5e5e5">€${total.toFixed(2)}</strong></p>
    </div>
    <p>En breve recibirás la información de seguimiento del envío.</p>
    <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/orders"
       style="display:inline-block;margin-top:8px;padding:12px 24px;background:#00FFFF;color:#000;font-weight:bold;border-radius:8px;text-decoration:none">
      Ver mis pedidos
    </a>
  </div>
  <div style="padding:16px;text-align:center;font-size:11px;color:#666">
    3D Print Shop — Este mensaje es automático, no respondas a este email.
  </div>
</div>`;
}

export function tplShipped(name: string, orderId: string, address: string): string {
  const ref = orderId.slice(-8).toUpperCase();
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;border-radius:12px;overflow:hidden">
  <div style="background:#111;padding:24px;border-bottom:2px solid #00FFFF">
    <h1 style="margin:0;color:#00FFFF;font-size:22px">📦 ¡Tu pedido ha sido enviado!</h1>
  </div>
  <div style="padding:24px">
    <p>Hola <strong>${name}</strong>,</p>
    <p>Tu pedido <strong>#${ref}</strong> está de camino. Dirección de entrega:</p>
    <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;color:#ccc">
      ${address}
    </div>
    <p>Puedes consultar el estado de todos tus pedidos en tu cuenta.</p>
    <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/orders"
       style="display:inline-block;margin-top:8px;padding:12px 24px;background:#00FFFF;color:#000;font-weight:bold;border-radius:8px;text-decoration:none">
      Ver mis pedidos
    </a>
  </div>
  <div style="padding:16px;text-align:center;font-size:11px;color:#666">
    3D Print Shop — Este mensaje es automático, no respondas a este email.
  </div>
</div>`;
}
