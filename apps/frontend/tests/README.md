# Playwright 테스트 가이드

이 프로젝트는 Playwright를 사용하여 E2E 테스트를 수행합니다.
Battle.net 인증이 필요한 테스트를 위해 세션 쿠키를 재사용하는 방식을 사용합니다.

## 초기 설정: 세션 저장하기

테스트를 실행하기 전에 한 번만 세션을 저장하면 됩니다.

### 1단계: 개발 서버 실행

```bash
pnpm dev
```

### 2단계: 브라우저에서 로그인

1. 브라우저에서 http://localhost:2000 접속
2. Battle.net으로 로그인

### 3단계: 세션 내보내기

로그인한 상태에서 다음 URL을 방문하세요:

```
http://localhost:2000/api/dev/export-session
```

브라우저에 JSON이 표시됩니다.

### 4단계: 세션 파일 저장

표시된 JSON을 **전체 복사**하여 `apps/frontend/playwright/.auth/user.json` 파일에 저장하세요:

```bash
# 디렉토리 생성
mkdir -p apps/frontend/playwright/.auth

# 파일 생성 및 편집 (복사한 JSON을 붙여넣기)
nano apps/frontend/playwright/.auth/user.json
# 또는
vim apps/frontend/playwright/.auth/user.json
```

**주의:** JSON 전체를 복사해야 합니다 (`{` 부터 `}` 까지)

## 테스트 실행

세션 파일이 준비되면 테스트를 실행할 수 있습니다:

```bash
# frontend 디렉토리에서
pnpm test              # 모든 테스트 실행
pnpm test:ui           # UI 모드로 테스트 실행
pnpm test:headed       # 브라우저를 보면서 테스트 실행
pnpm test:debug        # 디버그 모드로 테스트 실행
```

## 세션 만료 시

세션이 만료되면 위의 1-4단계를 다시 수행하여 새로운 세션을 저장하세요.

## 테스트 작성 팁

### 인증된 상태로 테스트

기본적으로 모든 테스트는 저장된 세션을 자동으로 사용합니다:

```typescript
test('인증된 사용자 테스트', async ({ page }) => {
  await page.goto('/');
  // 이미 로그인된 상태입니다
});
```

### 비인증 상태로 테스트

특정 테스트에서 세션을 사용하지 않으려면:

```typescript
test.use({ storageState: { cookies: [], origins: [] } });

test('비로그인 사용자 테스트', async ({ page }) => {
  await page.goto('/');
  // 로그인되지 않은 상태입니다
});
```

## 파일 구조

```
apps/frontend/
├── playwright.config.ts       # Playwright 설정
├── playwright/
│   └── .auth/
│       └── user.json         # 저장된 세션 (git에 커밋되지 않음)
└── tests/
    ├── README.md             # 이 파일
    ├── auth.setup.ts         # 인증 설정 체크
    └── example.spec.ts       # 예제 테스트
```

## 주의사항

- `playwright/.auth/user.json` 파일은 민감한 정보를 포함하므로 절대 git에 커밋하지 마세요
- 개발 환경에서만 `/api/dev/export-session` 엔드포인트를 사용할 수 있습니다
- 세션은 시간이 지나면 만료되므로, 테스트가 실패하면 세션을 다시 저장해보세요
