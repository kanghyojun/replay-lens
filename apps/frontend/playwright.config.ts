import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* 병렬 테스트 실행 */
  fullyParallel: true,

  /* CI에서 재시도 설정 */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  /* CI에서는 병렬 실행 안함 */
  workers: process.env.CI ? 1 : undefined,

  /* 리포터 설정 */
  reporter: 'html',

  /* 모든 테스트에 적용되는 공통 설정 */
  use: {
    /* Base URL - 상대 경로를 사용할 때 기본 URL */
    baseURL: 'http://localhost:2000',

    /* 실패한 테스트의 스크린샷 자동 저장 */
    screenshot: 'only-on-failure',

    /* 실패한 테스트의 비디오 자동 저장 */
    video: 'retain-on-failure',

    /* 실패한 테스트의 trace 자동 저장 */
    trace: 'on-first-retry',
  },

  /* 프로젝트별 설정 - 저장된 인증 세션 사용 */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 저장된 세션 사용
        storageState: path.join(__dirname, 'playwright/.auth/user.json'),
      },
      dependencies: ['setup'],
    },

    // 다른 브라우저에서도 테스트하고 싶다면 주석 해제
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: path.join(__dirname, 'playwright/.auth/user.json'),
    //   },
    //   dependencies: ['setup'],
    // },
    //
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: path.join(__dirname, 'playwright/.auth/user.json'),
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  /* 개발 서버 자동 시작 (필요시 사용) */
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:2000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
