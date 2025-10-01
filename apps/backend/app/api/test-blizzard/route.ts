import { NextRequest, NextResponse } from 'next/server';
import { blizzardAPI } from '../../../lib/blizzard-api';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');
  const accountId = searchParams.get('accountId');
  const regionId = searchParams.get('regionId');
  const realmId = searchParams.get('realmId');
  const profileId = searchParams.get('profileId');
  const ladderId = searchParams.get('ladderId');

  try {
    let data: any;
    let filename: string;

    switch (endpoint) {
      case 'profile':
        if (!accountId) {
          return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
        }
        data = await blizzardAPI.getPlayerProfile(accountId);
        filename = `profile_${accountId}_${Date.now()}.json`;
        break;

      case 'matches':
        if (!regionId || !realmId || !profileId) {
          return NextResponse.json({ error: 'regionId, realmId, profileId are required' }, { status: 400 });
        }
        data = await blizzardAPI.getPlayerMatches(
          parseInt(regionId),
          parseInt(realmId),
          parseInt(profileId)
        );
        filename = `matches_${regionId}_${realmId}_${profileId}_${Date.now()}.json`;
        break;

      case 'ladder-summary':
        if (!regionId || !realmId || !profileId) {
          return NextResponse.json({ error: 'regionId, realmId, profileId are required' }, { status: 400 });
        }
        data = await blizzardAPI.getLadderSummary(
          parseInt(regionId),
          parseInt(realmId),
          parseInt(profileId)
        );
        filename = `ladder_summary_${regionId}_${realmId}_${profileId}_${Date.now()}.json`;
        break;

      case 'ladder-detail':
        if (!regionId || !realmId || !profileId || !ladderId) {
          return NextResponse.json({ error: 'regionId, realmId, profileId, ladderId are required' }, { status: 400 });
        }
        data = await blizzardAPI.getLadderDetail(
          parseInt(regionId),
          parseInt(realmId),
          parseInt(profileId),
          ladderId
        );
        filename = `ladder_detail_${regionId}_${realmId}_${profileId}_${ladderId}_${Date.now()}.json`;
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
        parameters: { accountId, regionId, realmId, profileId, ladderId }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, params, saveResults = true } = body;

    let data: any;
    let filename: string;

    switch (endpoint) {
      case 'profile':
        if (!params.accountId) {
          return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
        }
        data = await blizzardAPI.getPlayerProfile(params.accountId);
        filename = `profile_${params.accountId}_${Date.now()}.json`;
        break;

      case 'matches':
        if (!params.regionId || !params.realmId || !params.profileId) {
          return NextResponse.json({ error: 'regionId, realmId, profileId are required' }, { status: 400 });
        }
        data = await blizzardAPI.getPlayerMatches(
          parseInt(params.regionId),
          parseInt(params.realmId),
          parseInt(params.profileId)
        );
        filename = `matches_${params.regionId}_${params.realmId}_${params.profileId}_${Date.now()}.json`;
        break;

      case 'ladder-summary':
        if (!params.regionId || !params.realmId || !params.profileId) {
          return NextResponse.json({ error: 'regionId, realmId, profileId are required' }, { status: 400 });
        }
        data = await blizzardAPI.getLadderSummary(
          parseInt(params.regionId),
          parseInt(params.realmId),
          parseInt(params.profileId)
        );
        filename = `ladder_summary_${params.regionId}_${params.realmId}_${params.profileId}_${Date.now()}.json`;
        break;

      case 'ladder-detail':
        if (!params.regionId || !params.realmId || !params.profileId || !params.ladderId) {
          return NextResponse.json({ error: 'regionId, realmId, profileId, ladderId are required' }, { status: 400 });
        }
        data = await blizzardAPI.getLadderDetail(
          parseInt(params.regionId),
          parseInt(params.realmId),
          parseInt(params.profileId),
          params.ladderId
        );
        filename = `ladder_detail_${params.regionId}_${params.realmId}_${params.profileId}_${params.ladderId}_${Date.now()}.json`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    // Save to file if requested
    if (saveResults) {
      const outputDir = path.join(process.cwd(), 'api-test-results');
      await fs.mkdir(outputDir, { recursive: true });
      const filePath = path.join(outputDir, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    return NextResponse.json({
      success: true,
      data,
      savedTo: saveResults ? filename : null,
      metadata: {
        endpoint,
        timestamp: new Date().toISOString(),
        parameters: params
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