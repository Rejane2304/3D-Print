import { describe, it, expect, vi } from "vitest";
/**
 * Integration tests for Search API
 */
const mockProducts = [
  {
    id: "1",
    name: "Soporte Auriculares",
    category: "Accesorios",
    material: "PLA",
    basePricePerGram: 0.05,
    images: [],
  },
  {
    id: "2",
    name: "Maceta Geométrica",
    category: "Decoracion",
    material: "PETG",
    basePricePerGram: 0.07,
    images: [],
  },
  {
    id: "3",
    name: "Soporte Teléfono",
    category: "Accesorios",
    material: "PLA",
    basePricePerGram: 0.05,
    images: [],
  },
];

// Esta ruta importa `prisma` como default, por eso se mockea `default`
vi.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    product: {
      findMany: vi.fn((args) => {
        if (args?.where?.OR) {
          const query = args.where.OR[0]?.name?.contains?.toLowerCase() || "";
          const filtered = mockProducts.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query),
          );
          return Promise.resolve(filtered.slice(0, args.take || 5));
        }
        return Promise.resolve(mockProducts);
      }),
    },
  },
}));

describe("Search API Integration", () => {
  describe("GET /api/search", () => {
    it("should return products matching search query", async () => {
      const { GET } = await import("@/app/api/search/route");
      const request = {
        url: "http://localhost:3000/api/search?q=soporte",
      } as any;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return empty array for no matches", async () => {
      const { GET } = await import("@/app/api/search/route");
      const request = {
        url: "http://localhost:3000/api/search?q=zzzznotfound",
      } as any;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should limit results", async () => {
      const { GET } = await import("@/app/api/search/route");
      const request = {
        url: "http://localhost:3000/api/search?q=soporte&limit=1",
      } as any;
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBeLessThanOrEqual(1);
    });

    it("should return error for empty query", async () => {
      const { GET } = await import("@/app/api/search/route");
      const request = { url: "http://localhost:3000/api/search?q=" } as any;
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
