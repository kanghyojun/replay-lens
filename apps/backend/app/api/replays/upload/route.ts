import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SC2Replay } from 'sc2ts';
import { db } from '@/lib/db';
import { replaysTable } from '@/lib/db/schema';
import { analyzeReplay } from '@/lib/replay-analysis';

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
    let replay: SC2Replay;
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
    type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
    const sanitizeData = (obj: unknown): JsonValue => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj === 'bigint') return obj.toString();
      if (typeof obj === 'string') {
        // Remove all null bytes and other problematic Unicode characters
        return obj.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      }
      if (typeof obj === 'boolean') return obj;
      if (typeof obj === 'number') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeData);
      if (typeof obj === 'object') {
        const sanitized: { [key: string]: JsonValue } = {};
        for (const key in obj) {
          sanitized[key] = sanitizeData((obj as Record<string, unknown>)[key]);
        }
        return sanitized;
      }
      return null;
    };

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

    // Perform replay analysis
    console.log('Analyzing replay...');
    const analysis = analyzeReplay(
      replay.trackerEvents,
      replay.gameEvents,
      replay.players
    );
    console.log('Analysis complete!');

    // Save to database
    const [insertedReplay] = await db.insert(replaysTable).values({
      userId: userId.toString(),
      filename: file.name,
      matchDate: replay.replayDetails?.timeUTC ? Number(replay.replayDetails.timeUTC) : null,
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
      gameEvents: sanitizeData(replay.gameEvents),
      trackerEvents: sanitizeData(replay.trackerEvents),
      messageEvents: sanitizeData(replay.messageEvents),
      analysis: sanitizeData(analysis), // Store computed analysis
      winner: replay.winner?.name || null,
      gameLength: replay.gameLength || null,
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
