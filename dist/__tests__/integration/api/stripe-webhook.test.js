import { describe, it, expect, beforeEach, vi } from "vitest";
/**
 * Integration tests for Stripe webhook
 * Verifica que el backend actualiza pedidos y puntos
 * de forma coherente con el evento recibido.
 */
const mockOrderUpdate = vi.fn(async () => ({
  id: "order_12345678",
  total: 25.9,
  userId: "user_1",
}));
const mockUserUpdate = vi.fn(async () => ({}));
const mockPointsCreate = vi.fn(async () => ({}));
const mockPrisma = {
  order: {
    update: mockOrderUpdate,
  },
  user: {
    update: mockUserUpdate,
  },
  pointsTransaction: {
    create: mockPointsCreate,
  },
};
vi.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: mockPrisma,
  default: mockPrisma,
}));
describe("Stripe Webhook API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should mark order as paid and award loyalty points", async () => {
    const { POST } = await import("@/app/api/webhook/stripe/route");
    const fakeEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {
            orderId: "order_12345678",
          },
        },
      },
    };
    const req = {
      json: async () => fakeEvent,
    };
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ received: true });
    // Se actualiza el pedido a "paid"
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: "order_12345678" },
      data: { status: "paid" },
    });
    // Se otorgan puntos de fidelidad en base al total (floor)
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { loyaltyPoints: { increment: 25 } },
    });
    expect(mockPointsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user_1",
          points: 25,
          type: "earned",
          orderId: "order_12345678",
        }),
      }),
    );
  });
  it("should ignore events without orderId but still respond OK", async () => {
    const { POST } = await import("@/app/api/webhook/stripe/route");
    const fakeEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {},
        },
      },
    };
    const req = {
      json: async () => fakeEvent,
    };
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockPointsCreate).not.toHaveBeenCalled();
  });
});
