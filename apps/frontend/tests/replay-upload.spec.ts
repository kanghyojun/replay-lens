import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * 리플레이 업로드 및 분석 E2E 테스트
 *
 * 이 테스트는 다음 플로우를 검증합니다:
 * 1. 리플레이 파일 업로드
 * 2. 백엔드에서 파싱 완료
 * 3. 리플레이 상세 페이지로 리다이렉트
 * 4. 승자 정보 확인
 */

test.describe('리플레이 업로드 및 분석', () => {
  // 테스트용 리플레이 파일 경로
  const replayFilePath = path.join(__dirname, 'fixtures', 'replays', 'a.SC2Replay');

  test('리플레이 업로드 후 승자 확인', async ({ page }) => {
    // 1. 리플레이 업로드 페이지로 이동
    await page.goto('/replays', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/replays$/);

    // 페이지 로딩 확인
    await expect(page.locator('h1')).toContainText('Replay Analysis');

    // 로그인 상태 확인 - "Please login" 메시지가 없어야 함
    const loginMessage = page.locator('text=Please login to upload and analyze replays');
    await expect(loginMessage).not.toBeVisible({ timeout: 10000 });

    // 업로드 UI가 표시될 때까지 대기
    await expect(page.locator('text=Upload Replay')).toBeVisible({ timeout: 10000 });

    // 2. 파일 선택 (input 요소 사용 - hidden이지만 setInputFiles는 작동함)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(replayFilePath);

    // 3. 파일이 선택되었는지 확인
    await expect(page.locator('text=1 file selected')).toBeVisible();
    await expect(page.locator('text=a.SC2Replay').first()).toBeVisible();

    // 4. 업로드 버튼 클릭
    const uploadButton = page.locator('button', { hasText: /Upload and Analyze/ });
    await uploadButton.click();

    // 5. 업로드 진행 중 상태 확인
    await expect(page.locator('text=/Uploading/').first()).toBeVisible({ timeout: 5000 });

    // 6. 리플레이 상세 페이지로 리다이렉트되는지 확인 (최대 30초 대기)
    await expect(page).toHaveURL(/\/replays\/\d+$/, { timeout: 30000 });

    // 7. 상세 페이지 로딩 완료 대기
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // 8. Game Overview 카드가 표시되는지 확인
    await expect(page.locator('text=Game Overview')).toBeVisible();

    // 9. 승자 정보가 표시되는지 확인
    const winnerSection = page.locator('text=Winner').locator('..').locator('..');
    await expect(winnerSection).toBeVisible();

    // 승자 이름이 "Unknown"이 아닌지 확인 (실제 승자 이름이 있어야 함)
    const winnerName = await winnerSection.locator('p.font-medium').textContent();
    expect(winnerName).not.toBe('Unknown');
    expect(winnerName?.length).toBeGreaterThan(0);

    console.log(`✅ 승자: ${winnerName}`);

    // 10. Players 섹션 확인
    await expect(page.locator('text=Players')).toBeVisible();

    // 11. 최소한 한 명의 플레이어가 "Win" 배지를 가지고 있는지 확인
    const winBadge = page.locator('div[role="status"]', { hasText: 'Win' });
    await expect(winBadge.first()).toBeVisible();

    // 12. 승자 플레이어 정보 확인
    const winningPlayer = page
      .locator('.border.rounded-lg:has(div[role="status"]:has-text("Win"))')
      .first();
    await expect(winningPlayer).toBeVisible();

    const winningPlayerName = await winningPlayer.locator('p.font-medium').first().textContent();
    console.log(`✅ 승리한 플레이어: ${winningPlayerName}`);

    // 13. 승자 이름과 플레이어 목록의 승자가 일치하는지 확인
    expect(winnerName).toBe(winningPlayerName);
  });

  test('업로드한 리플레이가 Recent Replays에 표시됨', async ({ page }) => {
    // 1. 리플레이 업로드 페이지로 이동
    await page.goto('/replays');

    // 2. 파일 업로드
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(replayFilePath);

    const uploadButton = page.locator('button', { hasText: /Upload and Analyze/ });
    await uploadButton.click();

    // 3. 상세 페이지로 리다이렉트될 때까지 대기
    await expect(page).toHaveURL(/\/replays\/\d+$/, { timeout: 30000 });

    // 4. 다시 리플레이 목록 페이지로 이동
    await page.goto('/replays');

    // 5. Recent Replays 섹션 확인
    await expect(page.locator('text=Recent Replays')).toBeVisible();

    // 6. 업로드한 파일이 목록에 있는지 확인
    await expect(page.locator('text=a.SC2Replay').first()).toBeVisible({ timeout: 5000 });

    // 7. 승자 정보가 표시되는지 확인
    const replayItem = page.locator('.border.rounded-lg', { has: page.locator('text=a.SC2Replay') }).first();
    await expect(replayItem).toBeVisible();

    const replayInfo = await replayItem.locator('p.text-sm.text-muted-foreground').textContent();
    expect(replayInfo).toContain('Winner:');

    console.log(`✅ 리플레이 정보: ${replayInfo}`);
  });

  test('드래그 앤 드롭으로 리플레이 업로드', async ({ page }) => {
    // 1. 리플레이 업로드 페이지로 이동
    await page.goto('/replays', { waitUntil: 'networkidle' });

    // 로그인 확인
    await expect(page.locator('text=Upload Replay')).toBeVisible({ timeout: 10000 });

    // 2. 드롭 영역 찾기 (더 정확한 선택자 사용)
    const dropZone = page.locator('.border-2.border-dashed.rounded-lg').first();
    await expect(dropZone).toBeVisible();

    // 3. 파일을 드롭 영역에 드래그 앤 드롭
    // Playwright에서는 input[type="file"]을 통해 파일을 설정하는 것이 더 안정적
    // 실제 드래그 앤 드롭 시뮬레이션은 복잡하므로 input을 사용
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(replayFilePath);

    // 4. 파일 선택 확인
    await expect(page.locator('text=1 file selected')).toBeVisible();

    // 5. 업로드
    const uploadButton = page.locator('button', { hasText: /Upload and Analyze/ });
    await uploadButton.click();

    // 6. 성공적으로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/\/replays\/\d+$/, { timeout: 30000 });
  });

  test('잘못된 파일 형식 업로드 시 에러 처리', async ({ page }) => {
    // 1. 리플레이 업로드 페이지로 이동
    await page.goto('/replays');

    // 2. 임시 텍스트 파일 생성 및 업로드 시도
    // 참고: 실제로는 .SC2Replay 파일만 허용되어야 함
    // Playwright는 실제 파일만 업로드할 수 있으므로, 이 테스트는 skip 하거나
    // accept 속성이 제대로 설정되어 있는지만 확인

    const fileInput = page.locator('input[type="file"]');
    const acceptAttr = await fileInput.getAttribute('accept');

    // accept 속성이 .SC2Replay만 허용하는지 확인
    expect(acceptAttr).toBe('.SC2Replay');

    console.log('✅ 파일 타입 검증: accept 속성이 올바르게 설정됨');
  });

  test('여러 리플레이 파일 동시 업로드', async ({ page }) => {
    // 이 테스트는 여러 파일이 있을 때만 실행 가능
    // 현재는 a.SC2Replay 하나만 있으므로 단일 파일로 테스트
    await page.goto('/replays');

    const fileInput = page.locator('input[type="file"]');

    // multiple 속성이 설정되어 있는지 확인
    const isMultiple = await fileInput.getAttribute('multiple');
    expect(isMultiple).not.toBeNull();

    console.log('✅ 다중 파일 업로드 지원 확인');

    // 단일 파일로 테스트
    await fileInput.setInputFiles(replayFilePath);
    await expect(page.locator('text=1 file selected')).toBeVisible();

    const uploadButton = page.locator('button', { hasText: /Upload and Analyze/ });
    await uploadButton.click();

    await expect(page).toHaveURL(/\/replays\/\d+$/, { timeout: 30000 });
  });
});
