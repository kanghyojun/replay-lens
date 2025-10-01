import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    console.log('OAuth token request - cookies:', cookieStore.getAll());
    console.log('Session cookie:', sessionCookie);

    if (!sessionCookie) {
      console.log('No session cookie found');
      return NextResponse.json(
        { error: 'Not authenticated. Please login with Battle.net first.' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete('session');
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    const accessToken = sessionData.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found in session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: accessToken,
      tokenType: 'Bearer',
      message: 'Using authenticated user token',
      user: {
        id: sessionData.user.id,
        battletag: sessionData.user.battletag,
      }
    });

  } catch (error) {
    console.error('OAuth token error:', error);
    return NextResponse.json(
      { error: 'Failed to get user token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}