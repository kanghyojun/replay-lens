import { test, expect } from '@playwright/test';

/**
 * 예제 테스트
 *
 * 이 테스트는 저장된 인증 세션을 사용하여 실행됩니다.
 * playwright.config.ts의 storageState 설정으로 자동으로 쿠키가 주입됩니다.
 */

test.describe('인증된 사용자 테스트', () => {
  test('홈페이지 접속 테스트', async ({ page }) => {
    // baseURL이 설정되어 있어 상대 경로 사용 가능
    await page.goto('/');

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/ReplayLens/i);
  });

  test('로그인 상태 확인', async ({ page }) => {
    await page.goto('/');

    // 로그인된 사용자만 볼 수 있는 요소 확인
    // (실제 프로젝트에 맞게 selector를 수정하세요)
    // 예: 사용자 아바타, 프로필 메뉴 등
    // await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();

    // 쿠키 확인 (Battle.net 세션)
    const cookies = await page.context().cookies();
    expect(cookies.length).toBeGreaterThan(0);
  });

  test('매치 히스토리 페이지 접속', async ({ page }) => {
    await page.goto('/');

    // 네비게이션이나 링크 클릭
    // await page.click('text=Match History');

    // 또는 직접 URL로 이동
    // await page.goto('/matches');

    // 페이지 로딩 확인
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('비인증 테스트', () => {
  // 특정 테스트에서만 세션을 사용하지 않으려면:
  test.use({ storageState: { cookies: [], origins: [] } });

  test('로그아웃 상태 테스트', async ({ page }) => {
    await page.goto('/');

    // 로그인 버튼 확인
    // await expect(page.locator('text=Login')).toBeVisible();
  });
});
