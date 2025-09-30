import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete('session');
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        battletag: sessionData.user.battletag,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null });
  }
}