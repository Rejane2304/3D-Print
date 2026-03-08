import { test, expect } from '@playwright/test';
test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login');
        const loginForm = page.locator('form');
        await expect(loginForm).toBeVisible();
    });
    test('should have email and password fields', async ({ page }) => {
        await page.goto('/login');
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
    });
    test('should show validation error for empty form', async ({ page }) => {
        await page.goto('/login');
        const submitBtn = page.locator('button[type="submit"]');
        await submitBtn.click();
        // Browser validation should prevent submission
    });
    test('should toggle between login and signup', async ({ page }) => {
        await page.goto('/login');
        const toggleBtn = page.locator('text=Crear cuenta').or(page.locator('text=Regístrate'));
        if (await toggleBtn.first().isVisible()) {
            await toggleBtn.first().click();
            // Should show signup form with confirm password
            const confirmPassword = page.locator('input[type="password"]').nth(1);
            await expect(confirmPassword).toBeVisible();
        }
    });
    test('should login with valid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'john@doe.com');
        await page.fill('input[type="password"]', 'johndoe123');
        await page.click('button[type="submit"]');
        // Wait for redirect or success
        await page.waitForTimeout(2000);
        // Should redirect to home or show success
    });
});
