import { test, expect } from '@playwright/test';
import path from 'node:path';

/**
 * Real-data E2E: drives the UI against the actual reviewpyper_api
 * (no synthetic test mode). Costs real OpenAI tokens — small CSV only.
 *
 * Skipped by default. Enable with:
 *   RUN_REAL_E2E=1 OPENAI_API_KEY=sk-... npm run e2e
 *
 * Inside docker compose, both env vars come from `docker-compose.real.yml`.
 *
 * Pre-conditions:
 *   - reviewpyper-api container is up on the same network as the gateway
 *   - The frontend is served with /config.json having "testMode": false
 *     (handled by mounting public/config.real.json -> public/config.json
 *     in docker-compose.real.yml).
 */
const ENABLED = !!process.env.RUN_REAL_E2E && !!process.env.OPENAI_API_KEY;

test.skip(!ENABLED, 'Set RUN_REAL_E2E=1 and OPENAI_API_KEY to run');

test('real: setup → upload CSV → run title screening returns an output path', async ({ page }) => {
  test.setTimeout(180_000); // model calls can take a while

  // ---- Setup page: create project + save real API key ----
  await page.goto('/setup');
  await expect(page.getByRole('heading', { name: /setup review/i })).toBeVisible();

  await page.getByLabel(/project name/i).fill('Real E2E Smoke');
  await page.getByLabel(/research question/i).fill(
    'Is deep brain stimulation effective for treatment-resistant OCD?',
  );
  await page.getByRole('button', { name: /create project/i }).click();
  await expect(page.getByRole('button', { name: /project created/i })).toBeVisible({ timeout: 15_000 });

  await page.getByLabel(/api key/i).fill(process.env.OPENAI_API_KEY!);
  await page.getByRole('button', { name: /save api key/i }).click();
  await expect(page.getByText(/api key saved/i)).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: /continue to title screening/i }).click();
  await expect(page).toHaveURL(/screening/);

  // ---- Title screening page ----
  const csv = path.join(import.meta.dirname, 'fixtures', 'refs_small.csv');
  await page.setInputFiles('input[type="file"]', csv);
  await expect(page.getByText(/file uploaded/i)).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: /run title screening/i }).click();

  // The Alert with title "Screening Complete" only appears on success.
  await expect(page.getByText(/screening complete/i)).toBeVisible({ timeout: 150_000 });

  // The "Continue to Abstract Screening" button is enabled only when an
  // output path was set on pipeline state — i.e. the backend really wrote a CSV.
  await expect(page.getByRole('button', { name: /continue to abstract screening/i })).toBeEnabled();
});
