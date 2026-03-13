// Constantes para evitar hardcodeo de contraseñas en los tests
const VALID_PASSWORD = process.env.TEST_VALID_PASSWORD || "testPassword123!";
const SHORT_PASSWORD = process.env.TEST_SHORT_PASSWORD || "short";
import { describe, it, expect } from "vitest";
import { z } from "zod";

const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100).optional(),
});

const CartItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  material: z.string().min(1, "material is required"),
  color: z.string().min(1, "color is required"),
  quantity: z.number().int().min(1).max(99).default(1),
  dimX: z.number().positive("dimX must be positive"),
  dimY: z.number().positive("dimY must be positive"),
  dimZ: z.number().positive("dimZ must be positive"),
  unitPrice: z.number().nonnegative("unitPrice must be non-negative"),
});

const ShippingSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional().default(""),
  zip: z.string().min(1),
  country: z.string().min(2),
});

describe("SignupSchema", () => {
  it("accepts valid signup data", () => {
    const result = SignupSchema.safeParse({
      email: "user@example.com",
      password: VALID_PASSWORD,
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = SignupSchema.safeParse({
      email: "not-an-email",
      password: VALID_PASSWORD,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid email address");
    }
  });

  it("rejects password shorter than 8 chars", () => {
    const result = SignupSchema.safeParse({
      email: "user@example.com",
      password: SHORT_PASSWORD,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password must be at least 8 characters");
    }
  });

  it("accepts signup without name (optional)", () => {
    const result = SignupSchema.safeParse({
      email: "user@example.com",
      password: VALID_PASSWORD,
    });
    expect(result.success).toBe(true);
  });
});

describe("CartItemSchema", () => {
  const validItem: {
    productId: string;
    material: string;
    color: string;
    quantity?: number;
    dimX: number;
    dimY: number;
    dimZ: number;
    unitPrice: number;
  } = {
    productId: "prod-123",
    material: "PLA",
    color: "Cyan",
    quantity: 2,
    dimX: 50,
    dimY: 50,
    dimZ: 50,
    unitPrice: 25.99,
  };

  it("accepts valid cart item", () => {
    const result = CartItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it("rejects empty productId", () => {
    const result = CartItemSchema.safeParse({ ...validItem, productId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects quantity 0", () => {
    const result = CartItemSchema.safeParse({ ...validItem, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects quantity over 99", () => {
    const result = CartItemSchema.safeParse({ ...validItem, quantity: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects negative dimX", () => {
    const result = CartItemSchema.safeParse({ ...validItem, dimX: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative unitPrice", () => {
    const result = CartItemSchema.safeParse({ ...validItem, unitPrice: -5 });
    expect(result.success).toBe(false);
  });

  it("accepts unitPrice of 0 (free item)", () => {
    const result = CartItemSchema.safeParse({ ...validItem, unitPrice: 0 });
    expect(result.success).toBe(true);
  });

  it("defaults quantity to 1 when not provided", () => {
    const withoutQty = { ...validItem };
    delete withoutQty.quantity;
    const result = CartItemSchema.safeParse(withoutQty);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });
});

describe("ShippingSchema", () => {
  const validShipping = {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+34612345678",
    address: "Calle Mayor 1",
    city: "Madrid",
    zip: "28001",
    country: "ES",
  };

  it("accepts valid shipping data", () => {
    const result = ShippingSchema.safeParse(validShipping);
    expect(result.success).toBe(true);
  });

  it("rejects invalid shipping email", () => {
    const result = ShippingSchema.safeParse({
      ...validShipping,
      email: "bad-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects country with less than 2 chars", () => {
    const result = ShippingSchema.safeParse({
      ...validShipping,
      country: "E",
    });
    expect(result.success).toBe(false);
  });

  it("defaults state to empty string when omitted", () => {
    const result = ShippingSchema.safeParse(validShipping);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe("");
    }
  });
});
