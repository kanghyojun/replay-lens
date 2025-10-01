import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { blizzardAPI } from '@/lib/blizzard-api';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete('session');
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get StarCraft 2 player account information using BlizzardAPI
    const sc2Accounts = await blizzardAPI.getPlayerProfile(sessionData.user.id);

    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        battletag: sessionData.user.battletag,
      },
      sc2Accounts,
      // 가장 최근에 플레이한 계정을 기본값으로 설정
      defaultAccount: sc2Accounts && sc2Accounts.length > 0 ? sc2Accounts[0] : null
    });

  } catch (error) {
    console.error('Get SC2 profile error:', error);
    return NextResponse.json({
      error: 'Failed to get SC2 profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}