import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { bnetStrategy } from '@/lib/auth/nextjs-passport';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/';

  if (!code) {
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}?error=no_code`
    );
  }

  try {
    // Use NextJS-compatible passport wrapper
    const { user, error } = await bnetStrategy.authenticate(req);

    if (error || !user) {
      console.error('Authentication failed:', error);
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}?error=auth_failed`
      );
    }

    // Create session data
    const sessionData = {
      user: {
        id: user.id,
        battletag: user.battletag,
        accessToken: user.accessToken,
      },
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    // Redirect to frontend with success
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}${state}?auth=success`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}?error=auth_failed`
    );
  }
}