// Playwright end‑to‑end test for the recipe‑community homepage
import { test, expect } from '@playwright/test';

test('homepage loads community component', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  const community = page.locator('[data-testid="community"]');
  await expect(community).toBeVisible({ timeout: 10000 });
});
