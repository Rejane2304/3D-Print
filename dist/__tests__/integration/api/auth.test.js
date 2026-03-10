import { describe, it, expect, vi } from "vitest";
// Integration tests for Authentication API
import bcrypt from "bcryptjs";
const mockUsers = [
  {
    id: "1",
    email: "test@example.com",
    password: bcrypt.hashSync("fakepass", 10),
    name: "Test User",
    role: "user",
  },
];
vi.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: vi.fn((args) => {
        const { where } = args;
        // Usar optional chaining para evitar advertencia
        const user = mockUsers.find((u) => u.email === where?.email);
        return Promise.resolve(user || null);
      }),
      create: vi.fn((args) => {
        const { data } = args;
        const newUser = {
          id: String(mockUsers.length + 1),
          ...data,
          role: "user",
        };
        mockUsers.push(newUser);
        return Promise.resolve(newUser);
      }),
    },
  },
}));
describe("Auth API Integration", () => {
  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const { POST } = await import("@/app/api/auth/login/route");
      const request = {
        json: async () => ({
          email: process.env.TEST_EMAIL || "test@example.com",
          password: process.env.TEST_PASSWORD || "fakepass",
        }),
      };
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.email).toBe("test@example.com");
    });
    it("should reject invalid password", async () => {
      const { POST } = await import("@/app/api/auth/login/route");
      const request = {
        json: async () => ({
          email: process.env.TEST_EMAIL || "test@example.com",
          password: process.env.TEST_PASSWORD_INVALID || "wrongpass",
        }),
      };
      const response = await POST(request);
      expect(response.status).toBe(401);
    });
    it("should reject non-existent user", async () => {
      const { POST } = await import("@/app/api/auth/login/route");
      const request = {
        json: async () => ({
          email:
            process.env.TEST_EMAIL_NONEXISTENT || "nonexistent@example.com",
          password: process.env.TEST_PASSWORD || "fakepass",
        }),
      };
      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });
  describe("POST /api/signup", () => {
    it("should create new user", async () => {
      const { POST } = await import("@/app/api/signup/route");
      const request = {
        json: async () => ({
          email: process.env.TEST_EMAIL_NEWUSER || "newuser@example.com",
          password: process.env.TEST_PASSWORD || "fakepass",
          name: "New User",
        }),
      };
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.email).toBe("newuser@example.com");
    });
    it("should reject duplicate email", async () => {
      const { POST } = await import("@/app/api/signup/route");
      const request = {
        json: async () => ({
          email: process.env.TEST_EMAIL || "test@example.com",
          password: process.env.TEST_PASSWORD || "fakepass",
          name: "Duplicate User",
        }),
      };
      const response = await POST(request);
      expect(response.status).toBe(409);
    });
  });
});
