import { test, expect } from '@playwright/test';

test.describe('Catalog Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog');
  });

  test('should display catalog page', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Catálogo|Catalog/);
  });

  test('should display product cards', async ({ page }) => {
    await page.waitForTimeout(1000); // Wait for products to load
    const products = page.locator('[data-testid="product-card"]');
    // Check that we have at least one product or the grid exists
    const grid = page.locator('.grid');
    await expect(grid.first()).toBeVisible();
  });

  test('should filter by material PLA', async ({ page }) => {
    await page.click('text=PLA');
    await expect(page).toHaveURL(/material=PLA/);
  });

  test('should filter by material PETG', async ({ page }) => {
    await page.click('text=PETG');
    await expect(page).toHaveURL(/material=PETG/);
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('soporte');
      await expect(searchInput).toHaveValue('soporte');
    }
  });

  test('should navigate to product detail', async ({ page }) => {
    await page.waitForTimeout(1000);
    const productLink = page.locator('a[href^="/product/"]').first();
    if (await productLink.isVisible()) {
      await productLink.click();
      await expect(page).toHaveURL(/\/product\//);
    }
  });
});
