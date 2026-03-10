import { describe, it, expect, vi } from "vitest";
/**
 * Integration tests for Products API
 * These tests require a test database connection (mockeado con Prisma)
 */
// Mock Prisma
const mockProducts = [
  {
    id: "1",
    name: "Soporte Auriculares",
    description: "Soporte elegante para auriculares",
    category: "Accesorios",
    material: "PLA",
    basePricePerGram: 0.05,
    dimX: 15,
    dimY: 10,
    dimZ: 20,
    weight: 74.4,
    finishCost: 2,
    images: ["/images/product1.jpg"],
    colors: ["Cyan", "White", "Black"],
    stock: 50,
    rating: 4.5,
    reviewCount: 12,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Maceta Geométrica",
    description: "Maceta con diseño geométrico moderno",
    category: "Decoracion",
    material: "PETG",
    basePricePerGram: 0.07,
    dimX: 12,
    dimY: 12,
    dimZ: 15,
    weight: 54.86,
    finishCost: 3,
    images: ["/images/product2.jpg"],
    colors: ["Amber", "Green"],
    stock: 30,
    rating: 4.8,
    reviewCount: 8,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    product: {
      findMany: vi.fn(() => Promise.resolve(mockProducts)),
      findUnique: vi.fn((args) => {
        const product = mockProducts.find((p) => p.id === args.where.id);
        return Promise.resolve(product ? { ...product, reviews: [] } : null);
      }),
      count: vi.fn(() => Promise.resolve(mockProducts.length)),
    },
  },
}));

describe("Products API Integration", () => {
  describe("GET /api/products", () => {
    it("should return list of products", async () => {
      const { GET } = await import("@/app/api/products/route");
      const request = { url: "http://localhost:3000/api/products" } as any;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toBeDefined();
      expect(Array.isArray(data.products)).toBe(true);
    });

    it("should filter by material", async () => {
      const { GET } = await import("@/app/api/products/route");
      const request = {
        url: "http://localhost:3000/api/products?material=PLA",
      } as any;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toBeDefined();
    });

    it("should filter by category", async () => {
      const { GET } = await import("@/app/api/products/route");
      const request = {
        url: "http://localhost:3000/api/products?category=Decoracion",
      } as any;
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should support pagination", async () => {
      const { GET } = await import("@/app/api/products/route");
      const request = {
        url: "http://localhost:3000/api/products?page=1&limit=10",
      } as any;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.page).toBeDefined();
      expect(data.totalPages).toBeDefined();
    });
  });

  describe("GET /api/products/[id]", () => {
    it("should return a single product", async () => {
      const { GET } = await import("@/app/api/products/[id]/route");
      const request = { url: "http://localhost:3000/api/products/1" } as any;
      const response = await GET(request, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("1");
    });

    it("should return 404 for non-existent product", async () => {
      const { GET } = await import("@/app/api/products/[id]/route");
      const request = { url: "http://localhost:3000/api/products/999" } as any;
      const response = await GET(request, { params: { id: "999" } });

      expect(response.status).toBe(404);
    });
  });
});
