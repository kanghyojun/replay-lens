export const GAME_LOOPS_PER_SECOND = 22.4;
export const ONE_MINUTE_IN_LOOPS = 60 * GAME_LOOPS_PER_SECOND; // 1344
export const THIRTY_SECONDS_IN_LOOPS = 30 * GAME_LOOPS_PER_SECOND; // 672
export const SEVEN_MINUTES_IN_LOOPS = 7 * 60 * GAME_LOOPS_PER_SECOND; // 9408

export function gameLoopToSeconds(gameLoop: number): number {
  return Math.floor(gameLoop / GAME_LOOPS_PER_SECOND);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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

export function isWorker(unitName: string): boolean {
  return ['Probe', 'SCV', 'Drone'].includes(unitName);
}
