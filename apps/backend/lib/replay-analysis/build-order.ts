import type { TrackerEvent, Player } from 'sc2ts';
import { gameLoopToSeconds, formatTime, isBuilding, SEVEN_MINUTES_IN_LOOPS } from './utils';
import type { BuildOrderTimeline } from './types';

interface UnitEvent {
  unitName: string;
  gameLoop: number;
  playerId: number;
}

interface UpgradeEvent {
  upgradeName: string;
  gameLoop: number;
  playerId: number;
}

// Non-gameplay upgrades to filter out
const IGNORED_UPGRADES = [
  'SprayProtoss',
  'SprayTerran',
  'SprayZerg',
  'RewardDance',
  'RewardDanceGhost',
  'RewardDanceStalker',
  'RewardDanceColossus',
  'RewardDanceOracle',
  'RewardDanceMule',
  'RewardDanceViking',
  'RewardDanceOverlord',
];

function shouldIgnoreUpgrade(upgradeName: string): boolean {
  return IGNORED_UPGRADES.some(ignored => upgradeName.startsWith(ignored));
}

function getBucketTime(gameLoop: number): number {
  const seconds = gameLoopToSeconds(gameLoop);

  // Before 7 minutes: use exact time
  if (gameLoop < SEVEN_MINUTES_IN_LOOPS) {
    return seconds;
  }

  // After 7 minutes: round to 30-second buckets
  const thirtySecondBucket = Math.floor(seconds / 30) * 30;
  return thirtySecondBucket;
}

export function extractBuildOrder(
  trackerEvents: TrackerEvent[],
  _players: Player[] // eslint-disable-line @typescript-eslint/no-unused-vars
): BuildOrderTimeline[] {
  const unitEvents: UnitEvent[] = [];
  const upgradeEvents: UpgradeEvent[] = [];

  console.log('Total tracker events:', trackerEvents.length);

  // Extract SUnitInitEvent (building completion)
  for (const event of trackerEvents) {
    if (event.eventType === 'NNet.Replay.Tracker.SUnitInitEvent') {
      const unitName = (event as unknown as { m_unitTypeName?: string }).m_unitTypeName;
      const playerId = (event as unknown as { m_controlPlayerId?: number }).m_controlPlayerId;
      const gameLoop = event._gameloop;

      if (unitName && playerId && gameLoop !== undefined) {
        unitEvents.push({
          unitName,
          gameLoop,
          playerId,
        });
      }
    }

    // Extract SUpgradeEvent
    if (event.eventType === 'NNet.Replay.Tracker.SUpgradeEvent') {
      const upgradeName = (event as unknown as { m_upgradeTypeName?: string }).m_upgradeTypeName;
      const playerId = (event as unknown as { m_playerId?: number }).m_playerId;
      const gameLoop = event._gameloop;

      if (upgradeName && playerId && gameLoop !== undefined && !shouldIgnoreUpgrade(upgradeName)) {
        upgradeEvents.push({
          upgradeName,
          gameLoop,
          playerId,
        });
      }
    }
  }

  // Group events by time buckets
  const timelineBuckets: Record<number, BuildOrderTimeline> = {};

  // Process unit events
  for (const unitEvent of unitEvents) {
    const bucketTime = getBucketTime(unitEvent.gameLoop);

    if (!(bucketTime in timelineBuckets)) {
      timelineBuckets[bucketTime] = {
        time: bucketTime,
        timeLabel: formatTime(bucketTime),
        players: {},
      };
    }

    const timeline = timelineBuckets[bucketTime];

    if (!(unitEvent.playerId in timeline.players)) {
      timeline.players[unitEvent.playerId] = {
        buildings: {},
        units: {},
        upgrades: {},
      };
    }

    const playerItems = timeline.players[unitEvent.playerId];

    // Separate buildings and units
    if (isBuilding(unitEvent.unitName)) {
      const currentCount = playerItems.buildings[unitEvent.unitName] || 0;
      playerItems.buildings[unitEvent.unitName] = currentCount + 1;
    } else {
      const currentCount = playerItems.units[unitEvent.unitName] || 0;
      playerItems.units[unitEvent.unitName] = currentCount + 1;
    }
  }

  // Process upgrade events
  for (const upgradeEvent of upgradeEvents) {
    const bucketTime = getBucketTime(upgradeEvent.gameLoop);

    if (!(bucketTime in timelineBuckets)) {
      timelineBuckets[bucketTime] = {
        time: bucketTime,
        timeLabel: formatTime(bucketTime),
        players: {},
      };
    }

    const timeline = timelineBuckets[bucketTime];

    if (!(upgradeEvent.playerId in timeline.players)) {
      timeline.players[upgradeEvent.playerId] = {
        buildings: {},
        units: {},
        upgrades: {},
      };
    }

    const playerItems = timeline.players[upgradeEvent.playerId];
    const currentCount = playerItems.upgrades[upgradeEvent.upgradeName] || 0;
    playerItems.upgrades[upgradeEvent.upgradeName] = currentCount + 1;
  }

  // Convert to sorted array
  const timeline = Object.values(timelineBuckets).sort((a, b) => a.time - b.time);

  console.log('Unit events found:', unitEvents.length);
  console.log('Upgrade events found:', upgradeEvents.length);
  console.log('Timeline buckets:', timeline.length);

  return timeline;
}
