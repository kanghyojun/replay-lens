import type { TrackerEvent, Player } from 'sc2ts';

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

export interface BuildOrderItem {
  buildings: Map<string, number>; // buildingName -> count
  units: Map<string, number>; // unitName -> count
  upgrades: Map<string, number>; // upgradeName -> count
}

export interface BuildOrderTimeline {
  time: number; // in seconds
  timeLabel: string; // "MM:SS"
  players: Map<number, BuildOrderItem>; // playerId -> BuildOrderItem
}

const GAME_LOOPS_PER_SECOND = 22.4;
const SEVEN_MINUTES_IN_LOOPS = 7 * 60 * GAME_LOOPS_PER_SECOND; // 9408

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

function gameLoopToSeconds(gameLoop: number): number {
  return Math.floor(gameLoop / GAME_LOOPS_PER_SECOND);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  _players: Player[]
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
  const timelineBuckets = new Map<number, BuildOrderTimeline>();

  // Process unit events
  for (const unitEvent of unitEvents) {
    const bucketTime = getBucketTime(unitEvent.gameLoop);

    if (!timelineBuckets.has(bucketTime)) {
      timelineBuckets.set(bucketTime, {
        time: bucketTime,
        timeLabel: formatTime(bucketTime),
        players: new Map(),
      });
    }

    const timeline = timelineBuckets.get(bucketTime)!;

    if (!timeline.players.has(unitEvent.playerId)) {
      timeline.players.set(unitEvent.playerId, {
        buildings: new Map(),
        units: new Map(),
        upgrades: new Map(),
      });
    }

    const playerItems = timeline.players.get(unitEvent.playerId)!;

    // Separate buildings and units
    if (isBuilding(unitEvent.unitName)) {
      const currentCount = playerItems.buildings.get(unitEvent.unitName) || 0;
      playerItems.buildings.set(unitEvent.unitName, currentCount + 1);
    } else {
      const currentCount = playerItems.units.get(unitEvent.unitName) || 0;
      playerItems.units.set(unitEvent.unitName, currentCount + 1);
    }
  }

  // Process upgrade events
  for (const upgradeEvent of upgradeEvents) {
    const bucketTime = getBucketTime(upgradeEvent.gameLoop);

    if (!timelineBuckets.has(bucketTime)) {
      timelineBuckets.set(bucketTime, {
        time: bucketTime,
        timeLabel: formatTime(bucketTime),
        players: new Map(),
      });
    }

    const timeline = timelineBuckets.get(bucketTime)!;

    if (!timeline.players.has(upgradeEvent.playerId)) {
      timeline.players.set(upgradeEvent.playerId, {
        buildings: new Map(),
        units: new Map(),
        upgrades: new Map(),
      });
    }

    const playerItems = timeline.players.get(upgradeEvent.playerId)!;
    const currentCount = playerItems.upgrades.get(upgradeEvent.upgradeName) || 0;
    playerItems.upgrades.set(upgradeEvent.upgradeName, currentCount + 1);
  }

  // Convert to sorted array
  const timeline = Array.from(timelineBuckets.values()).sort((a, b) => a.time - b.time);

  console.log('Unit events found:', unitEvents.length);
  console.log('Upgrade events found:', upgradeEvents.length);
  console.log('Timeline buckets:', timeline.length);
  console.log('First few timeline entries:', timeline.slice(0, 3));

  return timeline;
}

// Utility function to abbreviate unit/building names
export function abbreviateUnitName(unitName: string): string {
  // Common abbreviations
  const abbreviations: Record<string, string> = {
    // Protoss
    'Pylon': 'Py',
    'Gateway': 'Gw',
    'CyberneticsCore': 'Cy',
    'Forge': 'Fo',
    'PhotonCannon': 'Pc',
    'Assimilator': 'As',
    'Nexus': 'Nx',
    'RoboticsFacility': 'Rb',
    'Stargate': 'Sg',
    'TwilightCouncil': 'Tw',
    'TemplarArchive': 'Ta',
    'DarkShrine': 'Ds',
    'RoboticsBay': 'Ry',
    'FleetBeacon': 'Fb',
    'ShieldBattery': 'Sb',

    // Terran
    'CommandCenter': 'Cc',
    'Barracks': 'Rax',
    'Factory': 'Fac',
    'Starport': 'Sp',
    'SupplyDepot': 'Sd',
    'Refinery': 'Ref',
    'EngineeringBay': 'Eb',
    'MissileTurret': 'Mt',
    'Bunker': 'Bk',
    'Armory': 'Arm',
    'FusionCore': 'Fc',

    // Zerg
    'Hatchery': 'Ha',
    'Extractor': 'Ex',
    'SpawningPool': 'Pl',
    'EvolutionChamber': 'Ev',
    'RoachWarren': 'Rw',
    'BanelingNest': 'Bn',
    'SpineCrawler': 'Sc',
    'SporeCrawler': 'Sr',
    'Lair': 'La',
    'HydraliskDen': 'Hd',
    'LurkerDen': 'Ld',
    'InfestationPit': 'Ip',
    'Spire': 'Sp',
    'NydusNetwork': 'Nn',
    'UltraliskCavern': 'Uc',
    'Hive': 'Hi',
    'GreaterSpire': 'Gs',
  };

  if (abbreviations[unitName]) {
    return abbreviations[unitName];
  }

  // Default: take first 2 characters
  return unitName.slice(0, 2);
}

// Utility function to check if a unit is a building
export function isBuilding(unitName: string): boolean {
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

// Utility function to abbreviate upgrade names
export function abbreviateUpgradeName(upgradeName: string): string {
  const abbreviations: Record<string, string> = {
    // Protoss
    'WarpGateResearch': 'WG',
    'Charge': 'Ch',
    'Blink': 'Bl',
    'ProtossGroundWeaponsLevel1': '+1A',
    'ProtossGroundWeaponsLevel2': '+2A',
    'ProtossGroundWeaponsLevel3': '+3A',
    'ProtossGroundArmorsLevel1': '+1D',
    'ProtossGroundArmorsLevel2': '+2D',
    'ProtossGroundArmorsLevel3': '+3D',
    'ProtossShieldsLevel1': '+1S',
    'ProtossShieldsLevel2': '+2S',
    'ProtossShieldsLevel3': '+3S',
    'ProtossAirWeaponsLevel1': '+1R',
    'ProtossAirWeaponsLevel2': '+2R',
    'ProtossAirWeaponsLevel3': '+3R',
    'ProtossAirArmorsLevel1': '+1D',
    'ProtossAirArmorsLevel2': '+2D',
    'ProtossAirArmorsLevel3': '+3D',

    // Terran
    'TerranInfantryWeaponsLevel1': '+1A',
    'TerranInfantryWeaponsLevel2': '+2A',
    'TerranInfantryWeaponsLevel3': '+3A',
    'TerranInfantryArmorsLevel1': '+1D',
    'TerranInfantryArmorsLevel2': '+2D',
    'TerranInfantryArmorsLevel3': '+3D',
    'TerranVehicleWeaponsLevel1': '+1A',
    'TerranVehicleWeaponsLevel2': '+2A',
    'TerranVehicleWeaponsLevel3': '+3A',
    'TerranVehicleArmorsLevel1': '+1D',
    'TerranVehicleArmorsLevel2': '+2D',
    'TerranVehicleArmorsLevel3': '+3D',
    'TerranShipWeaponsLevel1': '+1R',
    'TerranShipWeaponsLevel2': '+2R',
    'TerranShipWeaponsLevel3': '+3R',
    'TerranShipArmorsLevel1': '+1D',
    'TerranShipArmorsLevel2': '+2D',
    'TerranShipArmorsLevel3': '+3D',

    // Zerg
    'ZergMeleeWeaponsLevel1': '+1A',
    'ZergMeleeWeaponsLevel2': '+2A',
    'ZergMeleeWeaponsLevel3': '+3A',
    'ZergMissileWeaponsLevel1': '+1R',
    'ZergMissileWeaponsLevel2': '+2R',
    'ZergMissileWeaponsLevel3': '+3R',
    'ZergGroundArmorsLevel1': '+1D',
    'ZergGroundArmorsLevel2': '+2D',
    'ZergGroundArmorsLevel3': '+3D',
    'ZergFlyerWeaponsLevel1': '+1R',
    'ZergFlyerWeaponsLevel2': '+2R',
    'ZergFlyerWeaponsLevel3': '+3R',
    'ZergFlyerArmorsLevel1': '+1D',
    'ZergFlyerArmorsLevel2': '+2D',
    'ZergFlyerArmorsLevel3': '+3D',
  };

  if (abbreviations[upgradeName]) {
    return abbreviations[upgradeName];
  }

  // Default: take first 3 characters
  return upgradeName.slice(0, 3);
}
