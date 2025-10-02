import type { TrackerEvent, Player } from 'sc2ts';

export interface EconomySnapshot {
  time: number; // in seconds
  timeLabel: string; // "MM:SS"
  mineralsCurrent: number;
  vespeneCurrent: number;
  mineralsCollectionRate: number;
  vespeneCollectionRate: number;
  // Total minerals/vespene used
  mineralsUsedTotal: number;
  vespeneUsedTotal: number;
  // Lost resources
  mineralsLostTotal: number;
  vespeneLostTotal: number;
  workersActive: number;
  // Delta values (difference from previous minute)
  mineralsUsedDelta: number;
  vespeneUsedDelta: number;
}

export interface EconomyTimeline {
  playerId: number;
  snapshots: EconomySnapshot[];
}

const GAME_LOOPS_PER_SECOND = 22.4;
const ONE_MINUTE_IN_LOOPS = 60 * GAME_LOOPS_PER_SECOND; // 1344
const THIRTY_SECONDS_IN_LOOPS = 30 * GAME_LOOPS_PER_SECOND; // 672

function gameLoopToSeconds(gameLoop: number): number {
  return Math.floor(gameLoop / GAME_LOOPS_PER_SECOND);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function extractEconomy(
  trackerEvents: TrackerEvent[],
  players: Player[]
): EconomyTimeline[] {
  // Group events by player
  const playerEvents = new Map<number, Array<{ gameloop: number; stats: Record<string, number> }>>();

  for (const event of trackerEvents) {
    if (event.eventType === 'NNet.Replay.Tracker.SPlayerStatsEvent') {
      const playerId = (event as unknown as { m_playerId?: number }).m_playerId;
      const stats = (event as unknown as { m_stats?: Record<string, number> }).m_stats;
      const gameloop = event._gameloop;

      if (playerId && stats && gameloop !== undefined) {
        if (!playerEvents.has(playerId)) {
          playerEvents.set(playerId, []);
        }

        playerEvents.get(playerId)!.push({
          gameloop,
          stats,
        });
      }
    }
  }

  // Find the game end time
  const maxGameLoop = Math.max(...trackerEvents.map(e => e._gameloop));
  const maxIntervals = Math.ceil(gameLoopToSeconds(maxGameLoop) / 30); // 30-second intervals

  // Create economy timeline for each player
  const timelines: EconomyTimeline[] = [];

  for (let i = 0; i < players.length; i++) {
    const playerId = i + 1; // Player IDs are 1-based
    const events = playerEvents.get(playerId) || [];

    if (events.length === 0) {
      timelines.push({
        playerId,
        snapshots: [],
      });
      continue;
    }

    // Sort events by gameloop
    events.sort((a, b) => a.gameloop - b.gameloop);

    const snapshots: EconomySnapshot[] = [];
    let prevMineralsUsed = 0;
    let prevVespeneUsed = 0;

    // Create snapshots for each 30-second interval
    for (let interval = 1; interval <= maxIntervals; interval++) {
      const targetGameLoop = interval * THIRTY_SECONDS_IN_LOOPS;
      const targetSeconds = interval * 30;

      // Find the closest event to this 30-second mark
      let closestEvent = events[0];
      let minDiff = Math.abs(events[0].gameloop - targetGameLoop);

      for (const event of events) {
        const diff = Math.abs(event.gameloop - targetGameLoop);
        if (diff < minDiff) {
          minDiff = diff;
          closestEvent = event;
        }
        // Stop searching if we've passed the target
        if (event.gameloop > targetGameLoop) {
          break;
        }
      }

      const stats = closestEvent.stats;

      // Calculate totals
      const mineralsUsedTotal =
        (stats.m_scoreValueMineralsUsedCurrentArmy || 0) +
        (stats.m_scoreValueMineralsUsedCurrentEconomy || 0) +
        (stats.m_scoreValueMineralsUsedCurrentTechnology || 0) +
        (stats.m_scoreValueMineralsUsedInProgressArmy || 0) +
        (stats.m_scoreValueMineralsUsedInProgressEconomy || 0) +
        (stats.m_scoreValueMineralsUsedInProgressTechnology || 0);

      const vespeneUsedTotal =
        (stats.m_scoreValueVespeneUsedCurrentArmy || 0) +
        (stats.m_scoreValueVespeneUsedCurrentEconomy || 0) +
        (stats.m_scoreValueVespeneUsedCurrentTechnology || 0) +
        (stats.m_scoreValueVespeneUsedInProgressArmy || 0) +
        (stats.m_scoreValueVespeneUsedInProgressEconomy || 0) +
        (stats.m_scoreValueVespeneUsedInProgressTechnology || 0);

      const mineralsLostTotal =
        (stats.m_scoreValueMineralsLostArmy || 0) +
        (stats.m_scoreValueMineralsLostEconomy || 0) +
        (stats.m_scoreValueMineralsLostTechnology || 0);

      const vespeneLostTotal =
        (stats.m_scoreValueVespeneLostArmy || 0) +
        (stats.m_scoreValueVespeneLostEconomy || 0) +
        (stats.m_scoreValueVespeneLostTechnology || 0);

      // Calculate delta (difference from previous minute)
      const mineralsUsedDelta = mineralsUsedTotal - prevMineralsUsed;
      const vespeneUsedDelta = vespeneUsedTotal - prevVespeneUsed;

      snapshots.push({
        time: targetSeconds,
        timeLabel: formatTime(targetSeconds),
        mineralsCurrent: stats.m_scoreValueMineralsCurrent || 0,
        vespeneCurrent: stats.m_scoreValueVespeneCurrent || 0,
        mineralsCollectionRate: stats.m_scoreValueMineralsCollectionRate || 0,
        vespeneCollectionRate: stats.m_scoreValueVespeneCollectionRate || 0,
        mineralsUsedTotal,
        vespeneUsedTotal,
        mineralsLostTotal,
        vespeneLostTotal,
        workersActive: stats.m_scoreValueWorkersActiveCount || 0,
        mineralsUsedDelta,
        vespeneUsedDelta,
      });

      prevMineralsUsed = mineralsUsedTotal;
      prevVespeneUsed = vespeneUsedTotal;
    }

    timelines.push({
      playerId,
      snapshots,
    });
  }

  console.log('Economy timelines:', timelines);

  return timelines;
}
