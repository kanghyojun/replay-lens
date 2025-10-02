import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readFile } from 'fs/promises';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { SC2Replay } from 'sc2ts';
import { db } from '@/lib/db';
import { replaysTable } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
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

    const userId = sessionData.user.id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('replay') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No replay file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.SC2Replay')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a .SC2Replay file' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse replay using sc2ts
    let replay;
    try {
      replay = SC2Replay.fromBuffer(buffer);
    } catch (error) {
      console.error('Replay parsing error:', error);
      return NextResponse.json(
        { error: 'Failed to parse replay file. The file may be corrupted.' },
        { status: 400 }
      );
    }

    // Helper function to sanitize data: convert BigInt to string and remove null bytes
    const sanitizeData = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return obj.toString();
      if (typeof obj === 'string') {
        // Remove all null bytes and other problematic Unicode characters
        return obj.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      }
      if (Array.isArray(obj)) return obj.map(sanitizeData);
      if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeData(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    // Extract replay data
    const replayData = sanitizeData({
      filename: file.name,
      fileSize: file.size,
      matchDate: replay.replayDetails?.timeUTC,
      mapName: replay.replayDetails?.title,
      gameLength: replay.gameLength,
      winner: replay.winner?.name,
      players: replay.players.map(p => ({
        name: p.name,
        race: p.race,
        teamId: p.teamId,
        color: p.color,
        result: p.result,
      })),
      replayHeader: replay.replayHeader,
      replayDetails: replay.replayDetails,
    });

    // Save replay file to disk
    const uploadsDir = path.join(process.cwd(), 'uploads', 'replays', userId);
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    // Determine game type from number of players
    const playersPerTeam = new Map<number, number>();
    replay.players.forEach(p => {
      playersPerTeam.set(p.teamId, (playersPerTeam.get(p.teamId) || 0) + 1);
    });
    const teams = Array.from(playersPerTeam.values());
    const gameType = teams.length === 2 ? `${teams[0]}v${teams[1]}` : 'FFA';

    // Remove cacheHandles from replayDetails
    const replayDetailsWithoutCache = replay.replayDetails ? {
      ...replay.replayDetails,
      cacheHandles: undefined,
    } : null;

    // Save to database
    const [insertedReplay] = await db.insert(replaysTable).values({
      userId: userId.toString(),
      filename: file.name,
      matchDate: replay.replayDetails?.timeUTC ? BigInt(replay.replayDetails.timeUTC) : null,
      mapName: replay.replayDetails?.title || null,
      gameType,
      replayHeader: sanitizeData(replay.replayHeader),
      replayDetails: sanitizeData(replayDetailsWithoutCache),
      players: sanitizeData(replay.players.map(p => ({
        name: p.name,
        race: p.race,
        teamId: p.teamId,
        color: p.color,
        result: p.result,
      }))),
      winner: replay.winner?.name || null,
      gameLength: replay.gameLength || null,
      filePath,
      fileSize: file.size,
    }).returning();

    return NextResponse.json({
      success: true,
      replayId: insertedReplay.id,
      message: 'Replay uploaded and parsed successfully',
      data: sanitizeData(insertedReplay),
    });

  } catch (error) {
    console.error('Replay upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload replay', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
