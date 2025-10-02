import type { TrackerEvent, Player } from 'sc2ts';

export interface SupplyBlock {
  startTime: number; // in seconds
  endTime: number; // in seconds
  startTimeLabel: string; // "MM:SS"
  endTimeLabel: string; // "MM:SS"
  duration: number; // in seconds
  supply: number; // 15, 23, etc.
}

export interface SupplyBlockTimeline {
  playerId: number;
  blocks: SupplyBlock[];
  totalBlockTime: number; // total seconds supply blocked
}

const GAME_LOOPS_PER_SECOND = 22.4;
const SUPPLY_SCALE = 4096; // Supply values are stored as value * 4096

function gameLoopToSeconds(gameLoop: number): number {
  return Math.floor(gameLoop / GAME_LOOPS_PER_SECOND);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function extractSupplyBlocks(
  trackerEvents: TrackerEvent[],
  players: Player[]
): SupplyBlockTimeline[] {
  // Group events by player
  const playerEvents = new Map<number, Array<{ gameloop: number; foodMade: number; foodUsed: number }>>();

  for (const event of trackerEvents) {
    if (event.eventType === 'NNet.Replay.Tracker.SPlayerStatsEvent') {
      const playerId = (event as unknown as { m_playerId?: number }).m_playerId;
      const stats = (event as unknown as { m_stats?: Record<string, number> }).m_stats;
      const gameloop = event._gameloop;

      if (playerId && stats && gameloop !== undefined) {
        const foodMade = stats.m_scoreValueFoodMade || 0;
        const foodUsed = stats.m_scoreValueFoodUsed || 0;

        if (!playerEvents.has(playerId)) {
          playerEvents.set(playerId, []);
        }

        playerEvents.get(playerId)!.push({
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
    const events = playerEvents.get(playerId) || [];

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
    let currentBlock: Partial<SupplyBlock> | null = null;

    events.forEach((event, idx) => {
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
        currentBlock.endTime = endSeconds;
        currentBlock.endTimeLabel = formatTime(endSeconds);
        currentBlock.duration = endSeconds - (currentBlock.startTime || 0);

        // Only include blocks longer than 1 second
        if (currentBlock.duration > 1) {
          blocks.push(currentBlock as SupplyBlock);
        }
        currentBlock = null;
      }
    });

    // If still blocked at the end of the game
    if (currentBlock) {
      const lastEvent = events[events.length - 1];
      const endSeconds = gameLoopToSeconds(lastEvent.gameloop);
      currentBlock.endTime = endSeconds;
      currentBlock.endTimeLabel = formatTime(endSeconds);
      currentBlock.duration = endSeconds - (currentBlock.startTime || 0);

      if (currentBlock.duration > 1) {
        blocks.push(currentBlock as SupplyBlock);
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
