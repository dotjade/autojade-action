import { test, expect } from '@playwright/test';

test('visit example.com and check title', async ({ page }) => {
  // Go to example.com
  await page.goto('https://example.com/');

  // Check that the title is correct
  await expect(page).toHaveTitle('Example Domain');
});
