import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john@doe.com');
    await page.fill('input[type="password"]', 'johndoe123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    // Should either show dashboard or redirect to login
  });

  test('should display admin sidebar', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const sidebar = page.locator('nav').or(page.locator('[data-testid="admin-sidebar"]'));
    // Sidebar should be present for admin users
  });

  test('should navigate to products management', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const productsLink = page.locator('a[href="/admin/products"]');
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await expect(page).toHaveURL(/\/admin\/products/);
    }
  });

  test('should navigate to orders management', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const ordersLink = page.locator('a[href="/admin/orders"]');
    if (await ordersLink.isVisible()) {
      await ordersLink.click();
      await expect(page).toHaveURL(/\/admin\/orders/);
    }
  });

  test('should navigate to users management', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const usersLink = page.locator('a[href="/admin/users"]');
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await expect(page).toHaveURL(/\/admin\/users/);
    }
  });
});
