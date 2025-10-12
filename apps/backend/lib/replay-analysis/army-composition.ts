import type { TrackerEvent, Player } from 'sc2ts';
import { gameLoopToSeconds, formatTime, isBuilding, isWorker, ONE_MINUTE_IN_LOOPS } from './utils';
import type { ArmyCompositionSnapshot } from './types';

interface UnitTracker {
  unitName: string;
  playerId: number;
  bornAt: number;
  diedAt?: number;
}

function shouldTrackUnit(unitName: string): boolean {
  // Exclude buildings, workers, and map objects
  if (isBuilding(unitName)) return false;
  if (isWorker(unitName)) return false;

  // Exclude units starting with certain prefixes
  if (unitName.startsWith('Beacon')) return false;

  // Exclude map objects and non-combat units
  const excludeList = [
    'MineralField', 'MineralField750', 'LabMineralField', 'BattleStationMineralField750',
    'VespeneGeyser', 'RichVespeneGeyser',
    'Xel\'NagaTower',
    'UnbuildablePlatesDestructible',
    'Larva', 'Egg', 'Cocoon',
    'ChangelingZergling', 'ChangelingZealot', 'ChangelingMarineShield',
  ];

  return !excludeList.some(exclude => unitName.includes(exclude));
}

export function extractArmyComposition(
  trackerEvents: TrackerEvent[],
  _players: Player[] // eslint-disable-line @typescript-eslint/no-unused-vars
): ArmyCompositionSnapshot[] {
  // Track all units by their tag (index + recycle)
  const unitTracker: Record<string, UnitTracker> = {};

  // First pass: track unit births and deaths
  for (const event of trackerEvents) {
    if (event.eventType === 'NNet.Replay.Tracker.SUnitBornEvent') {
      const unitName = (event as unknown as { m_unitTypeName?: string }).m_unitTypeName;
      const playerId = (event as unknown as { m_controlPlayerId?: number }).m_controlPlayerId;
      const tagIndex = (event as unknown as { m_unitTagIndex?: number }).m_unitTagIndex;
      const tagRecycle = (event as unknown as { m_unitTagRecycle?: number }).m_unitTagRecycle;
      const gameLoop = event._gameloop;

      if (unitName && playerId && tagIndex !== undefined && tagRecycle !== undefined && shouldTrackUnit(unitName)) {
        const unitKey = `${tagIndex}_${tagRecycle}`;
        unitTracker[unitKey] = {
          unitName,
          playerId,
          bornAt: gameLoop,
        };
      }
    }

    if (event.eventType === 'NNet.Replay.Tracker.SUnitDiedEvent') {
      const tagIndex = (event as unknown as { m_unitTagIndex?: number }).m_unitTagIndex;
      const tagRecycle = (event as unknown as { m_unitTagRecycle?: number }).m_unitTagRecycle;
      const gameLoop = event._gameloop;

      if (tagIndex !== undefined && tagRecycle !== undefined) {
        const unitKey = `${tagIndex}_${tagRecycle}`;
        const unit = unitTracker[unitKey];
        if (unit) {
          unit.diedAt = gameLoop;
        }
      }
    }
  }

  // Find the game end time
  const maxGameLoop = Math.max(...trackerEvents.map(e => e._gameloop));
  const maxMinutes = Math.ceil(gameLoopToSeconds(maxGameLoop) / 60);

  // Create snapshots for each minute
  const snapshots: ArmyCompositionSnapshot[] = [];

  for (let minute = 1; minute <= maxMinutes; minute++) {
    const targetGameLoop = minute * ONE_MINUTE_IN_LOOPS;
    const targetSeconds = minute * 60;

    const playerUnits: Record<number, Record<string, number>> = {};

    // Count units alive at this minute mark
    for (const unit of Object.values(unitTracker)) {
      // Check if unit is alive at this time
      const isAlive = unit.bornAt <= targetGameLoop && (!unit.diedAt || unit.diedAt > targetGameLoop);

      if (isAlive) {
        if (!playerUnits[unit.playerId]) {
          playerUnits[unit.playerId] = {};
        }

        const units = playerUnits[unit.playerId];
        const currentCount = units[unit.unitName] || 0;
        units[unit.unitName] = currentCount + 1;
      }
    }

    snapshots.push({
      time: targetSeconds,
      timeLabel: formatTime(targetSeconds),
      players: playerUnits,
    });
  }

  console.log('Total units tracked:', Object.keys(unitTracker).length);
  console.log('Army composition snapshots:', snapshots.length);

  return snapshots;
}
