import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { corsHeaders, createOptionsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return createOptionsResponse();
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { headers: corsHeaders() });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete('session');
      return NextResponse.json({ user: null }, { headers: corsHeaders() });
    }

    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        battletag: sessionData.user.battletag,
      }
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null }, { headers: corsHeaders() });
  }
}