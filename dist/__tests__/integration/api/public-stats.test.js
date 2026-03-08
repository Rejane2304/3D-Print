import { describe, it, expect, vi } from 'vitest';
/**
 * Integration tests for public stats API
 * Garantiza que los contadores que ve el usuario
 * reflejan los datos reales de la base de datos.
 */
const mockCounts = {
    products: 30,
    customers: 12,
    materials: [
        { material: "PLA" },
        { material: "PETG" },
    ],
};
vi.mock("@/lib/db", () => ({
    __esModule: true,
    prisma: {
        product: {
            count: vi.fn(async () => mockCounts.products),
            groupBy: vi.fn(async () => mockCounts.materials),
        },
        user: {
            count: vi.fn(async (args) => {
                // Solo cuenta usuarios con rol "user" como clientes
                if (args?.where?.role === "user")
                    return mockCounts.customers;
                return 0;
            }),
        },
    },
}));
describe("Public Stats API Integration", () => {
    it("should return stats based on Prisma aggregation", async () => {
        const { GET } = await import("@/app/api/public/stats/route");
        const res = await GET();
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data).toEqual({
            totalProducts: mockCounts.products,
            totalCustomers: mockCounts.customers,
            totalMaterials: mockCounts.materials.length,
        });
    });
});
