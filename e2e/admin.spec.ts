import { test, expect } from '@playwright/test';

// Test E2E: Login admin y acceso directo al panel

test('Admin puede loguearse y acceder al panel', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'admin@admin.com');
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'johndoe123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin', { timeout: 20000 });
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.locator('h2')).toContainText('Panel Admin');
});

// Test E2E: Acceso protegido (no admin)
test('Usuario no admin es redirigido a login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

// Test E2E: Navegación panel admin
test('Admin navega a gestión de productos', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('h2')).toContainText('Panel Admin');
  await page.click('a[href="/admin/products"]');
  await expect(page).toHaveURL(/\/admin\/products/);
});

test('Admin navega a gestión de usuarios', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('h2')).toContainText('Panel Admin');
  await page.click('a[href="/admin/users"]');
  await expect(page).toHaveURL(/\/admin\/users/);
});

test('Admin navega a gestión de órdenes', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('h2')).toContainText('Panel Admin');
  await page.click('a[href="/admin/orders"]');
  await expect(page).toHaveURL(/\/admin\/orders/);
});
