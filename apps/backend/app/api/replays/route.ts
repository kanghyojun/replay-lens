import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { replaysTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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

    // Get pagination parameters from query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Helper function to convert BigInt and Date to string recursively
    type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
    const serializeBigInt = (obj: unknown): JsonValue => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj === 'bigint') return obj.toString();
      if (obj instanceof Date) return obj.toISOString();
      if (typeof obj === 'boolean') return obj;
      if (typeof obj === 'number') return obj;
      if (typeof obj === 'string') return obj;
      if (Array.isArray(obj)) return obj.map(serializeBigInt);
      if (typeof obj === 'object') {
        const serialized: { [key: string]: JsonValue } = {};
        for (const key in obj) {
          serialized[key] = serializeBigInt((obj as Record<string, unknown>)[key]);
        }
        return serialized;
      }
      return null;
    };

    // Fetch total count (only count, no data)
    const totalReplays = await db
      .select({ id: replaysTable.id })
      .from(replaysTable)
      .where(eq(replaysTable.userId, userId.toString()));

    const total = totalReplays.length;

    // Fetch replays from database with pagination
    // Exclude large columns: replayHeader, replayDetails, players, gameEvents, trackerEvents, messageEvents, analysis
    const replays = await db
      .select({
        id: replaysTable.id,
        userId: replaysTable.userId,
        filename: replaysTable.filename,
        uploadedAt: replaysTable.uploadedAt,
        matchDate: replaysTable.matchDate,
        mapName: replaysTable.mapName,
        gameType: replaysTable.gameType,
        winner: replaysTable.winner,
        duration: replaysTable.duration,
        gameLength: replaysTable.gameLength,
        filePath: replaysTable.filePath,
        fileSize: replaysTable.fileSize,
      })
      .from(replaysTable)
      .where(eq(replaysTable.userId, userId.toString()))
      .orderBy(desc(replaysTable.uploadedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      replays: serializeBigInt(replays),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Replays list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replays' },
      { status: 500 }
    );
  }
}
