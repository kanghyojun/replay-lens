import { NextRequest, NextResponse } from 'next/server';
import { bnetStrategy } from '@/lib/auth/nextjs-passport';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '/';

  try {
    // Generate authorization URL with state parameter
    const authUrl = bnetStrategy.getAuthorizationUrl(returnTo);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}?error=auth_failed`
    );
  }
}