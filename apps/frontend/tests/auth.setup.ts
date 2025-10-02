import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '..', 'playwright/.auth/user.json');

/**
 * 인증 세션 설정
 *
 * 이 파일은 테스트 실행 전에 자동으로 실행되어
 * 저장된 세션이 있는지 확인합니다.
 */
setup('check auth session', async () => {
  if (!fs.existsSync(authFile)) {
    throw new Error(
      `❌ 인증 세션 파일을 찾을 수 없습니다: ${authFile}\n` +
        `먼저 다음 명령어를 실행하여 세션을 저장하세요:\n` +
        `npx tsx scripts/save-auth.ts`
    );
  }
  console.log('✅ 인증 세션을 찾았습니다.');
});
