import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * DEV ONLY: Export current session cookies for Playwright tests
 * This endpoint should only be accessible in development mode
 */
export async function GET(_request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Format cookies for Playwright storageState
    const playwrightCookies = allCookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: 'localhost',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const,
    }));

    const storageState = {
      cookies: playwrightCookies,
      origins: [],
    };

    return NextResponse.json(storageState, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error exporting session:', error);
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    );
  }
}
