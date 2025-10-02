import type { TrackerEvent, Player } from 'sc2ts';

interface UnitTracker {
  unitName: string;
  playerId: number;
  bornAt: number;
  diedAt?: number;
}

export interface ArmyCompositionSnapshot {
  time: number; // in seconds
  timeLabel: string; // "MM:SS"
  players: Map<number, Map<string, number>>; // playerId -> unitName -> count
}

const GAME_LOOPS_PER_SECOND = 22.4;
const ONE_MINUTE_IN_LOOPS = 60 * GAME_LOOPS_PER_SECOND; // 1344

function gameLoopToSeconds(gameLoop: number): number {
  return Math.floor(gameLoop / GAME_LOOPS_PER_SECOND);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function isBuilding(unitName: string): boolean {
  const buildings = [
    // Protoss
    'Nexus', 'Pylon', 'Gateway', 'Forge', 'PhotonCannon', 'Assimilator',
    'CyberneticsCore', 'ShieldBattery', 'RoboticsFacility', 'Stargate',
    'TwilightCouncil', 'TemplarArchive', 'DarkShrine', 'RoboticsBay',
    'FleetBeacon',

    // Terran
    'CommandCenter', 'SupplyDepot', 'Refinery', 'Barracks', 'OrbitalCommand',
    'EngineeringBay', 'MissileTurret', 'Bunker', 'SensorTower', 'Factory',
    'GhostAcademy', 'Starport', 'Armory', 'FusionCore', 'PlanetaryFortress',

    // Zerg
    'Hatchery', 'Extractor', 'SpawningPool', 'EvolutionChamber', 'RoachWarren',
    'BanelingNest', 'SpineCrawler', 'SporeCrawler', 'Lair', 'HydraliskDen',
    'LurkerDen', 'InfestationPit', 'Spire', 'NydusNetwork', 'NydusCanal',
    'UltraliskCavern', 'Hive', 'GreaterSpire',
  ];

  return buildings.includes(unitName);
}

function isWorker(unitName: string): boolean {
  return ['Probe', 'SCV', 'Drone'].includes(unitName);
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
  _players: Player[]
): ArmyCompositionSnapshot[] {
  // Track all units by their tag (index + recycle)
  const unitTracker = new Map<string, UnitTracker>();

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
        unitTracker.set(unitKey, {
          unitName,
          playerId,
          bornAt: gameLoop,
        });
      }
    }

    if (event.eventType === 'NNet.Replay.Tracker.SUnitDiedEvent') {
      const tagIndex = (event as unknown as { m_unitTagIndex?: number }).m_unitTagIndex;
      const tagRecycle = (event as unknown as { m_unitTagRecycle?: number }).m_unitTagRecycle;
      const gameLoop = event._gameloop;

      if (tagIndex !== undefined && tagRecycle !== undefined) {
        const unitKey = `${tagIndex}_${tagRecycle}`;
        const unit = unitTracker.get(unitKey);
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

    const playerUnits = new Map<number, Map<string, number>>();

    // Count units alive at this minute mark
    for (const unit of unitTracker.values()) {
      // Check if unit is alive at this time
      const isAlive = unit.bornAt <= targetGameLoop && (!unit.diedAt || unit.diedAt > targetGameLoop);

      if (isAlive) {
        if (!playerUnits.has(unit.playerId)) {
          playerUnits.set(unit.playerId, new Map());
        }

        const units = playerUnits.get(unit.playerId)!;
        const currentCount = units.get(unit.unitName) || 0;
        units.set(unit.unitName, currentCount + 1);
      }
    }

    snapshots.push({
      time: targetSeconds,
      timeLabel: formatTime(targetSeconds),
      players: playerUnits,
    });
  }

  console.log('Total units tracked:', unitTracker.size);
  console.log('Army composition snapshots:', snapshots.length);

  return snapshots;
}
