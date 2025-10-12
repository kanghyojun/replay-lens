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

    // Then get the ladder summary using those IDs
    const ladderSummary = await blizzardAPI.getLadderSummary(
      latestProfile.regionId,
      latestProfile.realmId,
      latestProfile.profileId
    );

    console.log('Raw ladder summary:', JSON.stringify(ladderSummary, null, 2));

    // Get detailed information for each ladder to ensure we have complete MMR data
    const processedLadders = await Promise.all(
      ladderSummary.showCaseEntries.map(async (entry) => {
        try {
          // Get detailed ladder information
          const ladderDetail = await blizzardAPI.getLadderDetail(
            latestProfile.regionId,
            latestProfile.realmId,
            latestProfile.profileId,
            entry.ladderId
          );

          console.log(`Ladder detail for ${entry.ladderId}:`, JSON.stringify(ladderDetail, null, 2));

          // Find the current player's team in the detailed ladder data
          const playerTeam = ladderDetail.ladderTeams.find(team =>
            team.teamMembers.some(member =>
              member.character.id === `${latestProfile.profileId}`
            )
          );

          // Use detailed data if available, otherwise fallback to summary
          const detailedMember = playerTeam?.teamMembers.find(member =>
            member.character.id === `${latestProfile.profileId}`
          );

          // Convert team structure to expected format
          const teamMembers = entry.team.members.map(member => ({
            favoriteRace: member.favoriteRace,
            name: member.name,
            displayName: member.name,
            playerId: member.playerId,
            region: member.region
          }));

          // For 1v1, use team-level data (which contains the actual MMR)
          const mmr = playerTeam?.mmr || entry.mmr;
          const wins = playerTeam?.wins || entry.wins;
          const losses = playerTeam?.losses || entry.losses;

          return {
            ladderId: entry.ladderId,
            teamMembers,
            localizedGameMode: entry.team.localizedGameMode,
            gameMode: entry.team.localizedGameMode,
            // Use team-level MMR data (this is where the actual MMR is in 1v1)
            mmr,
            wins,
            losses,
            rank: playerTeam?.rank || entry.rank,
            winRate: (wins + losses) > 0
              ? Math.round((wins / (wins + losses)) * 100)
              : 0,
            totalGames: wins + losses,
            league: entry.leagueName || ladderDetail.league || getLeagueName(mmr || 0),
            leagueName: entry.leagueName,
            localizedDivisionName: entry.localizedDivisionName,
            // Add additional detailed information from team
            previousRank: detailedMember?.previousRank,
            highestRank: detailedMember?.highestRank,
          };
        } catch (error) {
          console.error(`Failed to get detailed ladder info for ${entry.ladderId}:`, error);
          // Fallback to summary data if detailed fetch fails
          const fallbackTeamMembers = entry.team.members.map(member => ({
            favoriteRace: member.favoriteRace,
            name: member.name,
            displayName: member.name,
            playerId: member.playerId,
            region: member.region
          }));

          return {
            ladderId: entry.ladderId,
            teamMembers: fallbackTeamMembers,
            localizedGameMode: entry.team.localizedGameMode,
            gameMode: entry.team.localizedGameMode,
            mmr: entry.mmr,
            wins: entry.wins,
            losses: entry.losses,
            rank: entry.rank,
            winRate: entry.wins + entry.losses > 0
              ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
              : 0,
            totalGames: entry.wins + entry.losses,
            league: entry.leagueName || getLeagueName(entry.mmr || 0),
            leagueName: entry.leagueName,
            localizedDivisionName: entry.localizedDivisionName,
          };
        }
      })
    );

    console.log('Final processed ladders:', JSON.stringify(processedLadders, null, 2));

    return NextResponse.json({
      success: true,
      ladders: processedLadders,
      placementMatches: ladderSummary.placementMatches,
      allMemberships: ladderSummary.allLadderMemberships,
      profile: {
        name: latestProfile.name,
        regionName: blizzardAPI.getRegionName(latestProfile.regionId),
      },
    });

  } catch (error) {
    console.error('SC2 Ladder API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ladder summary' },
      { status: 500 }
    );
  }
}

function getLeagueName(mmr: number): string {
  // Updated MMR thresholds based on current SC2 league distribution
  if (mmr >= 5500) return 'Grandmaster';
  if (mmr >= 4900) return 'Master';
  if (mmr >= 4200) return 'Diamond';
  if (mmr >= 3500) return 'Platinum';
  if (mmr >= 2800) return 'Gold';
  if (mmr >= 2100) return 'Silver';
  return 'Bronze';
}