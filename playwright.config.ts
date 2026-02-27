import { defineConfig, devices } from '@playwright/test';

declare const process: {
    env: Record<string, string | undefined>;
};

const webPort = process.env.PW_WEB_PORT || '5193';
const webBaseUrl = `http://127.0.0.1:${webPort}`;

export default defineConfig({
    testDir: './__tests__/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,
    reporter: 'html',
    use: {
        baseURL: webBaseUrl,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: `pnpm exec vite --host 127.0.0.1 --port ${webPort} --strictPort`,
        url: webBaseUrl,
        reuseExistingServer: false,
        timeout: 120000,
    },
});
