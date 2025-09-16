import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { blizzardAPI } from '@/lib/blizzard-api';
import { corsHeaders, createOptionsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return createOptionsResponse();
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete('session');
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Extract account ID from the user data
    // The account ID should be available in the Battle.net OAuth response
    const accountId = sessionData.user.id;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID not found' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const profile = await blizzardAPI.getPlayerProfile(accountId);

    return NextResponse.json({
      success: true,
      profile,
      regionName: blizzardAPI.getRegionName(profile.regionId),
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('SC2 Profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500, headers: corsHeaders() }
    );
  }
}