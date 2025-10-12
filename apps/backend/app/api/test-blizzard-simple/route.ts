import { NextRequest, NextResponse } from 'next/server';
import { blizzardAPI } from '../../../lib/blizzard-api';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    if (sessionData.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');

    let data: unknown;
    let filename: string;

    // 내 계정 정보로 기본값 설정
    const myAccountId = sessionData.user.id;

    switch (endpoint) {
      // === COMMUNITY APIs - 기존 구현된 것들 ===
      case 'my-profile':
        data = await blizzardAPI.getPlayerProfile(myAccountId);
        filename = `my_profile_${myAccountId}_${Date.now()}.json`;
        break;

      case 'profile':
        const accountId = searchParams.get('accountId') || myAccountId;
        data = await blizzardAPI.getPlayerProfile(accountId);
        filename = `profile_${accountId}_${Date.now()}.json`;
        break;

      case 'matches':
        const regionId = searchParams.get('regionId') || '1';
        const realmId = searchParams.get('realmId') || '1';
        const profileId = searchParams.get('profileId');

        if (!profileId) {
          return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        data = await blizzardAPI.getPlayerMatches(
          parseInt(regionId),
          parseInt(realmId),
          parseInt(profileId)
        );
        filename = `matches_${regionId}_${realmId}_${profileId}_${Date.now()}.json`;
        break;

      case 'ladder-summary':
        const ladderRegionId = searchParams.get('regionId') || '1';
        const ladderRealmId = searchParams.get('realmId') || '1';
        const ladderProfileId = searchParams.get('profileId');

        if (!ladderProfileId) {
          return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        data = await blizzardAPI.getLadderSummary(
          parseInt(ladderRegionId),
          parseInt(ladderRealmId),
          parseInt(ladderProfileId)
        );
        filename = `ladder_summary_${ladderRegionId}_${ladderRealmId}_${ladderProfileId}_${Date.now()}.json`;
        break;

      case 'ladder-detail':
        const detailRegionId = searchParams.get('regionId') || '1';
        const detailRealmId = searchParams.get('realmId') || '1';
        const detailProfileId = searchParams.get('profileId');
        const ladderId = searchParams.get('ladderId');

        if (!detailProfileId || !ladderId) {
          return NextResponse.json({ error: 'profileId and ladderId are required' }, { status: 400 });
        }

        data = await blizzardAPI.getLadderDetail(
          parseInt(detailRegionId),
          parseInt(detailRealmId),
          parseInt(detailProfileId),
          ladderId
        );
        filename = `ladder_detail_${detailRegionId}_${detailRealmId}_${detailProfileId}_${ladderId}_${Date.now()}.json`;
        break;

      // === COMMUNITY APIs - 추가 엔드포인트들 ===
      case 'static-profile':
        const staticRegionId = searchParams.get('regionId') || '1';
        const staticRealmId = searchParams.get('realmId') || '1';
        const staticProfileId = searchParams.get('profileId');

        if (!staticProfileId) {
          return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        data = await blizzardAPI.getStaticProfile(
          parseInt(staticRegionId),
          parseInt(staticRealmId),
          parseInt(staticProfileId)
        );
        filename = `static_profile_${staticRegionId}_${staticRealmId}_${staticProfileId}_${Date.now()}.json`;
        break;

      case 'metadata-profile':
        const metaRegionId = searchParams.get('regionId') || '1';
        const metaRealmId = searchParams.get('realmId') || '1';
        const metaProfileId = searchParams.get('profileId');

        if (!metaProfileId) {
          return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        data = await blizzardAPI.getMetadataProfile(
          parseInt(metaRegionId),
          parseInt(metaRealmId),
          parseInt(metaProfileId)
        );
        filename = `metadata_profile_${metaRegionId}_${metaRealmId}_${metaProfileId}_${Date.now()}.json`;
        break;

      case 'account':
        const targetAccountId = searchParams.get('accountId') || myAccountId;
        data = await blizzardAPI.getAccount(targetAccountId);
        filename = `account_${targetAccountId}_${Date.now()}.json`;
        break;

      // === GAME DATA APIs ===
      case 'league-data':
        const seasonId = searchParams.get('seasonId') || '51';
        const queueId = searchParams.get('queueId') || '201';
        const teamType = searchParams.get('teamType') || '0';
        const leagueId = searchParams.get('leagueId') || '6';

        try {
          data = await blizzardAPI.getLeagueData(
            parseInt(seasonId),
            parseInt(queueId),
            parseInt(teamType),
            parseInt(leagueId)
          );
        } catch (error) {
          data = {
            error: 'Failed to fetch league data',
            details: error instanceof Error ? error.message : 'Unknown error',
            note: 'This API may require specific season/queue combinations or may not be publicly available'
          };
        }

        filename = `league_data_${seasonId}_${queueId}_${teamType}_${leagueId}_${Date.now()}.json`;
        break;

      case 'grandmaster-leaderboard':
        const gmRegionId = searchParams.get('regionId') || '1';

        try {
          data = await blizzardAPI.getGrandmasterLeaderboard(parseInt(gmRegionId));
        } catch (error) {
          data = {
            error: 'Failed to fetch grandmaster leaderboard',
            details: error instanceof Error ? error.message : 'Unknown error',
            note: 'Grandmaster leaderboard may not be available for this region or may require different access'
          };
        }

        filename = `grandmaster_leaderboard_${gmRegionId}_${Date.now()}.json`;
        break;

      case 'season-data':
        const seasonRegionId = searchParams.get('regionId') || '1';

        try {
          data = await blizzardAPI.getSeasonData(parseInt(seasonRegionId));
        } catch (error) {
          data = {
            error: 'Failed to fetch season data',
            details: error instanceof Error ? error.message : 'Unknown error',
            note: 'Season data API may not be available for this region'
          };
        }

        filename = `season_data_${seasonRegionId}_${Date.now()}.json`;
        break;

      case 'rewards':
        const rewardsRegionId = searchParams.get('regionId') || '1';

        try {
          data = await blizzardAPI.getRewards(parseInt(rewardsRegionId));
        } catch (error) {
          data = {
            error: 'Failed to fetch rewards data',
            details: error instanceof Error ? error.message : 'Unknown error',
            note: 'Rewards API may not be available for this region or may require different parameters'
          };
        }

        filename = `rewards_${rewardsRegionId}_${Date.now()}.json`;
        break;

      // === LEGACY APIs ===
      case 'legacy-profile':
        const legacyProfileRegionId = searchParams.get('regionId') || '1';
        const legacyProfileRealmId = searchParams.get('realmId') || '1';
        const legacyProfileId = searchParams.get('profileId');

        if (!legacyProfileId) {
          return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        try {
          data = await blizzardAPI.getLegacyProfile(
            parseInt(legacyProfileRegionId),
            parseInt(legacyProfileRealmId),
            parseInt(legacyProfileId)
          );
        } catch (error) {
          data = { error: 'Failed to fetch legacy profile', details: error instanceof Error ? error.message : 'Unknown error' };
        }

        filename = `legacy_profile_${legacyProfileRegionId}_${legacyProfileRealmId}_${legacyProfileId}_${Date.now()}.json`;
        break;

      case 'legacy-ladders':
        const legacyLaddersRegionId = searchParams.get('regionId') || '1';
        const legacyLaddersRealmId = searchParams.get('realmId') || '1';
        const legacyLaddersProfileId = searchParams.get('profileId');

        if (!legacyLaddersProfileId) {
          return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        try {
          data = await blizzardAPI.getLegacyLadders(
            parseInt(legacyLaddersRegionId),
            parseInt(legacyLaddersRealmId),
            parseInt(legacyLaddersProfileId)
          );
        } catch (error) {
          data = { error: 'Failed to fetch legacy ladders', details: error instanceof Error ? error.message : 'Unknown error' };
        }

        filename = `legacy_ladders_${legacyLaddersRegionId}_${legacyLaddersRealmId}_${legacyLaddersProfileId}_${Date.now()}.json`;
        break;

      case 'legacy-matches':
        const legacyMatchesRegionId = searchParams.get('regionId') || '1';
        const legacyMatchesRealmId = searchParams.get('realmId') || '1';
        const legacyMatchesProfileId = searchParams.get('profileId');

        if (!legacyMatchesProfileId) {
          return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        try {
          data = await blizzardAPI.getLegacyMatches(
            parseInt(legacyMatchesRegionId),
            parseInt(legacyMatchesRealmId),
            parseInt(legacyMatchesProfileId)
          );
        } catch (error) {
          data = { error: 'Failed to fetch legacy matches', details: error instanceof Error ? error.message : 'Unknown error' };
        }

        filename = `legacy_matches_${legacyMatchesRegionId}_${legacyMatchesRealmId}_${legacyMatchesProfileId}_${Date.now()}.json`;
        break;

      case 'legacy-ladder':
        const legacyLadderRegionId = searchParams.get('regionId') || '1';
        const legacyLadderId = searchParams.get('ladderId');

        if (!legacyLadderId) {
          return NextResponse.json({ error: 'ladderId is required' }, { status: 400 });
        }

        try {
          data = await blizzardAPI.getLegacyLadder(
            parseInt(legacyLadderRegionId),
            legacyLadderId
          );
        } catch (error) {
          data = { error: 'Failed to fetch legacy ladder', details: error instanceof Error ? error.message : 'Unknown error' };
        }

        filename = `legacy_ladder_${legacyLadderRegionId}_${legacyLadderId}_${Date.now()}.json`;
        break;

      case 'legacy-achievements':
        const legacyAchievementsRegionId = searchParams.get('regionId') || '1';

        try {
          data = await blizzardAPI.getLegacyAchievements(parseInt(legacyAchievementsRegionId));
        } catch (error) {
          data = { error: 'Failed to fetch legacy achievements', details: error instanceof Error ? error.message : 'Unknown error' };
        }

        filename = `legacy_achievements_${legacyAchievementsRegionId}_${Date.now()}.json`;
        break;

      case 'legacy-rewards':
        const legacyRewardsRegionId = searchParams.get('regionId') || '1';

        try {
          data = await blizzardAPI.getLegacyRewards(parseInt(legacyRewardsRegionId));
        } catch (error) {
          data = { error: 'Failed to fetch legacy rewards', details: error instanceof Error ? error.message : 'Unknown error' };
        }

        filename = `legacy_rewards_${legacyRewardsRegionId}_${Date.now()}.json`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    // Save to file
    const outputDir = path.join(process.cwd(), 'api-test-results');
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      data,
      savedTo: filename,
      metadata: {
        endpoint,
        timestamp: new Date().toISOString(),
        user: {
          id: sessionData.user.id,
          battletag: sessionData.user.battletag,
        },
        parameters: Object.fromEntries(searchParams.entries())
      }
    });

  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json(
      { error: 'Failed to test API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}