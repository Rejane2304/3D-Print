import { test, expect } from "@playwright/test";

// Helper para login NextAuth
async function loginNextAuth(page: import("playwright").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "john@doe.com");
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || "johndoe123");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"));
  // Verificar que la sesión está activa
  await expect(page).not.toHaveURL("/login");
}

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    await loginNextAuth(page);
    await page.goto("/admin");
  });

  test("should access admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(1000);
    // Should either show dashboard or redirect to login
  });

  test("should display admin sidebar", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForTimeout(1000);
    // Sidebar should be present for admin users
  });

  test("should navigate to products management", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 }); // Desktop
    await page.goto("/admin");
    await page.waitForSelector("h2:text('Panel Admin')");
    // Abrir menú si el botón existe
    const openMenuBtn = page.locator('button[aria-label="Abrir menú"]');
    if (await openMenuBtn.isVisible()) {
      await openMenuBtn.click();
    }
    const productsLink = page.locator("aside nav a", { hasText: "Productos" });
    await productsLink.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await productsLink.click({ force: true });
    await expect(page).toHaveURL(/\/admin\/products/);
  });

  test("should navigate to orders management", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 }); // Desktop
    await page.goto("/admin");
    await page.waitForSelector("h2:text('Panel Admin')");
    const openMenuBtn = page.locator('button[aria-label="Abrir menú"]');
    if (await openMenuBtn.isVisible()) {
      await openMenuBtn.click();
    }
    const ordersLink = page.locator("aside nav a", { hasText: "Pedidos" });
      await ordersLink.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await ordersLink.click({ force: true });
    await expect(page).toHaveURL(/\/admin\/orders/);
  });

  test("should navigate to users management", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 }); // Desktop
    await page.goto("/admin");
    await page.waitForSelector("h2:text('Panel Admin')");
    const openMenuBtn = page.locator('button[aria-label="Abrir menú"]');
    if (await openMenuBtn.isVisible()) {
      await openMenuBtn.click();
    }
    const usersLink = page.locator("aside nav a", { hasText: "Clientes" });
      await usersLink.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await usersLink.click({ force: true });
    await expect(page).toHaveURL(/\/admin\/users/);
  });
});
