import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 개발 환경 전용: 현재 세션을 Playwright 형식으로 export
 *
 * 사용법:
 * 1. 브라우저에서 Battle.net으로 로그인
 * 2. http://localhost:2000/api/dev/export-session 방문
 * 3. 표시된 JSON을 복사하여 apps/frontend/playwright/.auth/user.json 파일에 저장
 */
export async function GET(request: NextRequest) {
  // 프로덕션 환경에서는 접근 불가
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Playwright storageState 형식으로 변환
    const storageState = {
      cookies: allCookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
        path: '/',
        expires: -1, // Session cookie
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax' as const,
      })),
      origins: [],
    };

    // JSON으로 응답 (브라우저에서 복사 가능)
    return NextResponse.json(storageState, { status: 200 });
  } catch (error) {
    console.error('세션 export 중 오류:', error);
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    );
  }
}
