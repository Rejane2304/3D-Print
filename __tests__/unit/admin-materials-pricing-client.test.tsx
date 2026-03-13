import { describe, it, beforeEach, vi, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const MaterialColorsManagerMock = () => (
  <div data-testid="material-colors-manager-mock">Material colors manager mock</div>
);

vi.mock("framer-motion", () => {
  const ReactMock = require("react");
  const createMotionTag = (tag: string) =>
    ReactMock.forwardRef(({ children, ...rest }: React.ComponentPropsWithoutRef<"div">, ref) =>
      ReactMock.createElement(tag, { ref, ...rest }, children)
    );
  return {
    motion: new Proxy(
      {},
      {
        get: (_, prop: string) => createMotionTag(prop),
      }
    ),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => MaterialColorsManagerMock,
}));
vi.mock("@/components/toast-provider", () => ({ useToast: () => ({ showToast: vi.fn() }) }));

const loadAdminMaterialsPricingClient = async () => {
  const module = await import("@/app/admin/materials-pricing/_components/admin-materials-pricing-client");
  return module.default;
};

// Mock fetch global
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: 'mat-pla',
        name: 'PLA',
        code: 'PLA',
        pricePerKg: 20,
        density: 1.24,
        inStock: true,
      },
    ],
  }) as any;
});

describe("AdminMaterialsPricingClient", () => {
  it("renderiza encabezado y secciones principales", async () => {
    const AdminMaterialsPricingClient = await loadAdminMaterialsPricingClient();
    render(<AdminMaterialsPricingClient />);
    // Hay múltiples elementos con el texto 'Materiales', seleccionamos el primero
    const materialesElements = screen.getAllByText(/Materiales/i);
    expect(materialesElements[0]).toBeTruthy();
     const gestionElements = screen.getAllByText(/Gestión de materiales y precios/i);
     expect(gestionElements[0]).toBeTruthy();
     const costesElements = screen.getAllByText(/Motor de costes y márgenes/i);
     expect(costesElements[0]).toBeTruthy();
     const simuladorElements = screen.getAllByText(/Simulador de precio/i);
     expect(simuladorElements[0]).toBeTruthy();
  });

  it("muestra formulario de material y permite editar campos", async () => {
    const AdminMaterialsPricingClient = await loadAdminMaterialsPricingClient();
    render(<AdminMaterialsPricingClient />);
    const nombreInputs = await screen.findAllByPlaceholderText("Nombre");
    const nombre = nombreInputs[0];
    fireEvent.change(nombre, { target: { value: "PLA" } });
    expect((nombre as HTMLInputElement).value).toEqual("PLA");
  });

  // Más tests: simulador, recalculador, gestión de colores...
});
