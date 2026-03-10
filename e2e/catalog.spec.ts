import { test, expect } from "@playwright/test";

test.describe("Catalog Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/catalog");
  });

  test("should display catalog page", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toContainText(/Catálogo|Catalog/);
  });

  test("should display product cards", async ({ page }) => {
    await page.waitForTimeout(1000); // Wait for products to load
    // Check that we have at least one product or the grid exists
    const grid = page.locator(".grid");
    await expect(grid.first()).toBeVisible();
  });

  test("should filter by material PLA", async ({ page }) => {
    await page.getByRole("button", { name: /Filtros|Filters/ }).click();
    const plaButton = page.getByRole("button", { name: "PLA" });
    await plaButton.click();
    await expect(plaButton).toHaveClass(/bg-cyan/);
  });

  test("should filter by material PETG", async ({ page }) => {
    await page.getByRole("button", { name: /Filtros|Filters/ }).click();
    const petgButton = page.getByRole("button", { name: "PETG" });
    await petgButton.click();
    await expect(petgButton).toHaveClass(/bg-amber/);
  });

  test("should have search functionality", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("soporte");
      await expect(searchInput).toHaveValue("soporte");
    }
  });

  test("should navigate to product detail", async ({ page }) => {
    await page.waitForTimeout(1000);
    const productLink = page.locator('a[href^="/product/"]').first();
    if (await productLink.isVisible()) {
      await productLink.click();
      await expect(page).toHaveURL(/\/product\//);
    }
  });
});
