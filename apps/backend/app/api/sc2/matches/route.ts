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

    // Get current season data
    const seasonData = await blizzardAPI.getSeasonData(latestProfile.regionId);
    const currentSeasonStart = parseInt(seasonData.startDate);

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
      isWin: match.decision.toUpperCase() === 'WIN',
      isLoss: match.decision.toUpperCase() === 'LOSS',
    }));

    // Filter matches for current season
    const currentSeasonMatches = processedMatches.filter(
      match => match.date >= currentSeasonStart
    );

    // Note: Blizzard Legacy API returns only the most recent 25 matches
    // So the stats are based on recent 25 matches within the current season
    return NextResponse.json({
      success: true,
      matches: processedMatches,
      profile: {
        name: latestProfile.name,
        regionName: blizzardAPI.getRegionName(latestProfile.regionId),
      },
      season: {
        seasonId: seasonData.seasonId,
        number: seasonData.number,
        year: seasonData.year,
        startDate: currentSeasonStart,
      },
      apiLimit: 25, // Blizzard API only returns last 25 matches
      totalMatches: currentSeasonMatches.length,
      wins: currentSeasonMatches.filter(m => m.isWin).length,
      losses: currentSeasonMatches.filter(m => m.isLoss).length,
      winRate: currentSeasonMatches.length > 0
        ? (currentSeasonMatches.filter(m => m.isWin).length / currentSeasonMatches.length * 100).toFixed(1)
        : '0.0',
    });

  } catch (error) {
    console.error('SC2 Matches API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
