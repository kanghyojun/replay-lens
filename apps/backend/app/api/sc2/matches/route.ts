import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { blizzardAPI } from '@/lib/blizzard-api';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete('session');
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const accountId = sessionData.user.id;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID not found' },
        { status: 400 }
      );
    }

    // First get the player profile to get region/realm/profile IDs
    const profile = await blizzardAPI.getPlayerProfile(accountId);
    const latestProfile = profile.at(-1);
    if (latestProfile == null) {
      return NextResponse.json(
        { error: 'No StarCraft II profile found' },
        { status: 404 }
      );
    }

    // Then get the matches using those IDs
    const matches = await blizzardAPI.getPlayerMatches(
      latestProfile.regionId,
      latestProfile.realmId,
      latestProfile.profileId
    );

    // Process matches to add readable timestamps and other useful data
    const processedMatches = matches.map(match => ({
      ...match,
      dateFormatted: new Date(match.date * 1000).toLocaleString(),
      isWin: match.decision === 'WIN',
      isLoss: match.decision === 'LOSS',
    }));

    return NextResponse.json({
      success: true,
      matches: processedMatches,
      profile: {
        name: latestProfile.name,
        regionName: blizzardAPI.getRegionName(latestProfile.regionId),
      },
      totalMatches: processedMatches.length,
      wins: processedMatches.filter(m => m.isWin).length,
      losses: processedMatches.filter(m => m.isLoss).length,
    });

  } catch (error) {
    console.error('SC2 Matches API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
