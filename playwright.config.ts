import { defineConfig } from '@playwright/test';
import dotenvFlow from 'dotenv-flow';

// Load environment variables for tests
dotenvFlow.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30000,

  // Run global setup before any tests
  globalSetup: './tests/setup/global-setup.ts',

  use: {
    baseURL: process.env.API_BASE_URL || process.env.PORT || 'http://localhost:4000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    }
  }
});