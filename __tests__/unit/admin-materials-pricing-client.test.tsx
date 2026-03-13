import { describe, it, beforeEach, vi, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const MaterialColorsManagerMock = () => (
  <div data-testid="material-colors-manager-mock">Material colors manager</div>
);

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => MaterialColorsManagerMock,
}));
vi.mock("@/components/toast-provider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("framer-motion", () => {
  const ReactMock = require("react");
  const createMotionElement = (tag: string) =>
    ReactMock.forwardRef(({ children, ...rest }: React.ComponentPropsWithoutRef<"div">, ref) =>
      ReactMock.createElement(tag, { ref, ...rest }, children)
    );
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => createMotionElement(prop),
      }
    ),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

beforeEach(() => {
  // Reset fetch to avoid leaking data between tests
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: "mat-pla",
        code: "PLA",
        name: "PLA",
        pricePerKg: 20,
        density: 1.24,
        maintenanceFactor: 0.1,
        inStock: true,
      },
    ],
  }) as any;
});

async function loadComponent() {
  const module = await import("@/app/admin/materials-pricing/_components/admin-materials-pricing-client");
  return module.default;
}

describe("AdminMaterialsPricingClient", () => {
  it("renderiza los encabezados principales", async () => {
    const AdminMaterialsPricingClient = await loadComponent();
    render(<AdminMaterialsPricingClient />);
    await waitFor(() => {
      expect(screen.getAllByText(/Materiales/i)[0]).toBeTruthy();
    });
    expect(screen.getAllByText(/Gestión de materiales y precios/i)[0]).toBeTruthy();
    expect(screen.getAllByText(/Motor de costes y márgenes/i)[0]).toBeTruthy();
    expect(screen.getAllByText(/Simulador de precio/i)[0]).toBeTruthy();
  });

  it("permite editar el campo nombre del formulario", async () => {
    const AdminMaterialsPricingClient = await loadComponent();
    render(<AdminMaterialsPricingClient />);
    const nombreInputs = await screen.findAllByPlaceholderText("Nombre");
    const nombre = nombreInputs[0];
    fireEvent.change(nombre, { target: { value: "PLA" } });
    expect((nombre as HTMLInputElement).value).toBe("PLA");
  });
});
