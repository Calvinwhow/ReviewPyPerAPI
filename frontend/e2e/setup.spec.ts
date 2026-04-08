import { test, expect } from '@playwright/test';

/**
 * Smoke test for the SetupReview page driving real requests through the
 * gateway in `?test=true` mode (synthetic data, real files written).
 *
 * The full pipeline (title → extraction) is exercised at the API level
 * by the pytest suite. Here we verify the boot path: app loads, project
 * is created on the gateway, API key is persisted to disk, navigation
 * works.
 */
test('Setup flow creates a project and saves an API key', async ({ page }) => {
  await page.goto('/setup');

  await expect(page.getByRole('heading', { name: /setup review/i })).toBeVisible();

  await page.getByLabel(/project name/i).fill('Playwright Smoke');
  await page.getByLabel(/research question/i).fill('Does X improve Y?');

  await page.getByRole('button', { name: /create project/i }).click();
  await expect(page.getByRole('button', { name: /project created/i })).toBeVisible({ timeout: 10_000 });

  await page.getByLabel(/api key/i).fill('sk-test-fake');
  await page.getByRole('button', { name: /save api key/i }).click();
  await expect(page.getByText(/api key saved/i)).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: /continue to title screening/i }).click();
  await expect(page).toHaveURL(/screening/);
});

test('Network failure surfaces a toast', async ({ page }) => {
  // Force every gateway request to fail.
  await page.route('**/api/**', (route) => route.abort('failed'));
  await page.goto('/setup');

  await page.getByLabel(/project name/i).fill('Will Fail');
  await page.getByLabel(/research question/i).fill('q');
  await page.getByRole('button', { name: /create project/i }).click();

  // Global mutation cache should push an error toast.
  await expect(page.getByTestId('toast-error')).toBeVisible({ timeout: 5_000 });
});
