/// <reference types="node" />
import { defineConfig } from '@playwright/test';

/**
 * Boots both the gateway (in synthetic test mode) and the Vite dev server.
 * The frontend talks to /api/* which Vite proxies to localhost:8001 (the gateway).
 *
 * Requirements:
 *   - Python deps from cli/gateway/requirements.txt installed
 *   - Node deps from package.json installed
 *
 * Run with: npm run e2e
 */
// When PLAYWRIGHT_BASE_URL is set (e.g. inside docker compose), the gateway
// and frontend are already running as sibling services — skip webServer.
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
      command:
        'cd ../cli/gateway && DATA_DIR=./e2e-data uvicorn main:app --port 8001 --host 127.0.0.1',
      url: 'http://127.0.0.1:8001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
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
