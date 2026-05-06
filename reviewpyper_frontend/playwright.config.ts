/// <reference types="node" />
import { defineConfig } from '@playwright/test';

/**
 * E2E config. When run inside docker compose the API and Vite dev server
 * are already running as sibling services (PLAYWRIGHT_BASE_URL is set).
 * For local runs, both are booted automatically via webServer.
 *
 * Run with: npm run e2e
 */
const externalBase = process.env.PLAYWRIGHT_BASE_URL;

// real.spec.ts hits the actual reviewpyper_api with a real OpenAI key.
// Only included when RUN_REAL_E2E=1 so the default suite stays free + offline.
const includeReal = !!process.env.RUN_REAL_E2E;

export default defineConfig({
  testDir: './e2e',
  testIgnore: includeReal ? [] : ['**/real.spec.ts'],
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: externalBase || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: externalBase ? undefined : [
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
