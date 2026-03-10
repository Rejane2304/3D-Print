import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/3D Print/);
  });

  test("should display hero section", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("h1");
    await expect(hero).toBeVisible();
  });

  test("should navigate to catalog from CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Explorar catálogo" }).first().click();
    await expect(page).toHaveURL(/\/catalog/);
  });

  test("should display featured products", async ({ page }) => {
    await page.goto("/");
    const productsSection = page.locator("text=Productos Destacados").first();
    await expect(productsSection).toBeVisible();
  });

  test("should display material comparison", async ({ page }) => {
    await page.goto("/");
    const materialsSection = page.locator("text=PLA");
    await expect(materialsSection.first()).toBeVisible();
  });
});
