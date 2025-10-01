import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
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

    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete('session');
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const userId = sessionData.user.id;

    // TODO: Fetch from database using Drizzle ORM
    // For now, return empty array as we haven't implemented database storage yet
    const uploadsDir = path.join(process.cwd(), 'uploads', 'replays', userId);

    let replays = [];
    try {
      const files = await fs.readdir(uploadsDir);
      replays = files.map((file, index) => ({
        id: index + 1,
        filename: file.replace(/^\d+_/, ''), // Remove timestamp prefix
        uploadedAt: new Date().toISOString(),
        mapName: 'Unknown Map', // TODO: Load from metadata
        gameType: '1v1', // TODO: Load from metadata
      }));
    } catch (error) {
      // Directory doesn't exist yet, return empty array
      replays = [];
    }

    return NextResponse.json({
      success: true,
      replays,
    });

  } catch (error) {
    console.error('Replays list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replays' },
      { status: 500 }
    );
  }
}
