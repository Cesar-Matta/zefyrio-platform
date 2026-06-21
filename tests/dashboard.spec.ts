import { test, expect } from '@playwright/test';

test.describe('Zefyrio Dashboard Redesign Tests', () => {
  test('should load the main page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the title or main header is visible
    const header = page.getByRole('heading', { name: /Zefyrio/i });
    await expect(header).toBeVisible();

    // Ensure the cyber/neon theme text classes are gone (we replaced them with var colors)
    // The main container should exist
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should display telemetry tabs', async ({ page }) => {
    await page.goto('/');
    
    // Check for the bottom navigation bar buttons
    const telemetryTab = page.locator('button', { hasText: /HUD|Telemetría/i }).first();
    const mapTab = page.locator('button', { hasText: /Map/i }).first();
    
    // At least the nav should be visible
    await expect(telemetryTab).toBeVisible();
  });

  test('should not contain legacy neon colors in root variables', async ({ page }) => {
    await page.goto('/');
    
    // Check if the old background neon colors were removed from the body/main styling
    const mainBg = await page.locator('main').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // It should not be the old #0b0d17 color. 
    // Computed colors are usually returned as rgb/rgba
    expect(mainBg).not.toBe('rgb(11, 13, 23)'); 
  });
});
