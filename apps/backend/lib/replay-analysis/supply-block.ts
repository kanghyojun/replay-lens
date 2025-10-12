import type { TrackerEvent, Player } from 'sc2ts';
import { gameLoopToSeconds, formatTime } from './utils';
import type { SupplyBlock, SupplyBlockTimeline } from './types';

const SUPPLY_SCALE = 4096; // Supply values are stored as value * 4096

export function extractSupplyBlocks(
  trackerEvents: TrackerEvent[],
  players: Player[]
): SupplyBlockTimeline[] {
  // Group events by player
  const playerEvents: Record<number, Array<{ gameloop: number; foodMade: number; foodUsed: number }>> = {};

  for (const event of trackerEvents) {
    if (event.eventType === 'NNet.Replay.Tracker.SPlayerStatsEvent') {
      const playerId = (event as unknown as { m_playerId?: number }).m_playerId;
      const stats = (event as unknown as { m_stats?: Record<string, number> }).m_stats;
      const gameloop = event._gameloop;

      if (playerId && stats && gameloop !== undefined) {
        const foodMade = stats.m_scoreValueFoodMade || 0;
        const foodUsed = stats.m_scoreValueFoodUsed || 0;

        if (!playerEvents[playerId]) {
          playerEvents[playerId] = [];
        }

        playerEvents[playerId].push({
          gameloop,
          foodMade,
          foodUsed,
        });
      }
    }
  }

  // Analyze supply blocks for each player
  const timelines: SupplyBlockTimeline[] = [];

  for (let i = 0; i < players.length; i++) {
    const playerId = i + 1; // Player IDs are 1-based
    const events = playerEvents[playerId] || [];

    if (events.length === 0) {
      timelines.push({
        playerId,
        blocks: [],
        totalBlockTime: 0,
      });
      continue;
    }

    // Sort events by gameloop
    events.sort((a, b) => a.gameloop - b.gameloop);

    const blocks: SupplyBlock[] = [];
    let currentBlock: {
      startTime: number;
      startTimeLabel: string;
      supply: number;
    } | null = null;

    for (let idx = 0; idx < events.length; idx++) {
      const event = events[idx];
      const isBlocked = event.foodMade > 0 && event.foodMade === event.foodUsed;

      if (isBlocked && !currentBlock) {
        // Start of supply block
        const startSeconds = gameLoopToSeconds(event.gameloop);
        currentBlock = {
          startTime: startSeconds,
          startTimeLabel: formatTime(startSeconds),
          supply: event.foodMade / SUPPLY_SCALE,
        };
      } else if (!isBlocked && currentBlock) {
        // End of supply block
        const prevEvent = events[idx - 1];
        const endSeconds = gameLoopToSeconds(prevEvent.gameloop);
        const duration = endSeconds - currentBlock.startTime;

        // Only include blocks longer than 1 second
        if (duration > 1) {
          blocks.push({
            startTime: currentBlock.startTime,
            endTime: endSeconds,
            startTimeLabel: currentBlock.startTimeLabel,
            endTimeLabel: formatTime(endSeconds),
            duration,
            supply: currentBlock.supply,
          });
        }
        currentBlock = null;
      }
    }

    // If still blocked at the end of the game
    if (currentBlock) {
      const lastEvent = events[events.length - 1];
      const endSeconds = gameLoopToSeconds(lastEvent.gameloop);
      const duration = endSeconds - currentBlock.startTime;

      if (duration > 1) {
        blocks.push({
          startTime: currentBlock.startTime,
          endTime: endSeconds,
          startTimeLabel: currentBlock.startTimeLabel,
          endTimeLabel: formatTime(endSeconds),
          duration,
          supply: currentBlock.supply,
        });
      }
    }

    const totalBlockTime = blocks.reduce((sum, block) => sum + block.duration, 0);

    timelines.push({
      playerId,
      blocks,
      totalBlockTime,
    });
  }

  console.log('Supply block timelines:', timelines);

  return timelines;
}
