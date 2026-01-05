import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Fernanda Abreu Mangia/);
    });

    test('should verify Hero section visibility', async ({ page }) => {
        await expect(page.getByText(/Psicologia com Acolhimento/)).toBeVisible();
        await expect(page.getByRole('link', { name: 'Conhecer Serviços' })).toBeVisible();
    });

    test('should navigate to Contact section', async ({ page }) => {
        const contactLink = page.getByRole('link', { name: 'Contato', exact: true }).first();
        await expect(contactLink).toBeVisible();
        await contactLink.click();
        // Allow scroll time
        await expect(page.locator('#contato')).toBeInViewport();
    });
});
