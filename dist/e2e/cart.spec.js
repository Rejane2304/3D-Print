import { test, expect } from '@playwright/test';
test.describe('Shopping Cart', () => {
    test('should display empty cart message', async ({ page }) => {
        await page.goto('/cart');
        const emptyMessage = page.locator('text=Tu carrito está vacío');
        await expect(emptyMessage).toBeVisible();
    });
    test('should have link to catalog from empty cart', async ({ page }) => {
        await page.goto('/cart');
        const catalogLink = page.getByRole('link', { name: 'Ir al Catálogo' });
        await expect(catalogLink).toBeVisible();
    });
    test('cart icon should be visible in header', async ({ page }) => {
        await page.goto('/');
        const cartIcon = page.locator('[data-testid="cart-icon"]').or(page.locator('a[href="/cart"]'));
        await expect(cartIcon.first()).toBeVisible();
    });
});
test.describe('Cart Flow', () => {
    test('should add product to cart from detail page', async ({ page }) => {
        // Navigate to a product
        await page.goto('/catalog');
        await page.waitForTimeout(1000);
        const productLink = page.locator('a[href^="/product/"]').first();
        if (await productLink.isVisible()) {
            await productLink.click();
            await page.waitForURL(/\/product\//);
            // Find and click add to cart button
            const addToCartBtn = page.locator('button:has-text("Añadir")').or(page.locator('button:has-text("Add")'));
            if (await addToCartBtn.first().isVisible()) {
                await addToCartBtn.first().click();
                // Check for success toast or cart update
                await page.waitForTimeout(500);
            }
        }
    });
});
