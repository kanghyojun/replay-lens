import type { TrackerEvent, Player } from 'sc2ts';

export interface BattleUnit {
  unitName: string;
  playerId: number;
  resourceValue: number; // minerals + vespene cost
  isBuilding: boolean;
}

export interface Battle {
  startTime: number; // in seconds
  endTime: number; // in seconds
  startTimeLabel: string; // "MM:SS"
  endTimeLabel: string; // "MM:SS"
  duration: number; // in seconds
  unitsLost: BattleUnit[]; // all units lost in this battle
  resourcesLostByPlayer: Map<number, number>; // playerId -> total resource value lost
}

const GAME_LOOPS_PER_SECOND = 22.4;
const BATTLE_GAP_SECONDS = 3; // if no deaths for 3 seconds, battle is over
const BATTLE_GAP_LOOPS = BATTLE_GAP_SECONDS * GAME_LOOPS_PER_SECOND;

function gameLoopToSeconds(gameLoop: number): number {
  return Math.floor(gameLoop / GAME_LOOPS_PER_SECOND);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get approximate resource value for a unit (minerals + vespene)
function getUnitResourceValue(unitName: string): number {
  // This is a simplified mapping - you may want to expand this
  const unitCosts: Record<string, number> = {
    // Terran units
    'Marine': 50,
    'Marauder': 125,
    'Reaper': 75,
    'Ghost': 225,
    'Hellion': 100,
    'Hellbat': 100,
    'WidowMine': 100,
    'SiegeTank': 225,
    'Cyclone': 225,
    'Thor': 450,
    'VikingFighter': 175,
    'Medivac': 175,
    'Liberator': 200,
    'Raven': 200,
    'Banshee': 275,
    'Battlecruiser': 550,

    // Protoss units
    'Probe': 50,
    'Zealot': 150,
    'Stalker': 175,
    'Sentry': 100,
    'Adept': 150,
    'HighTemplar': 200,
    'DarkTemplar': 225,
    'Archon': 250,
    'Immortal': 350,
    'Colossus': 450,
    'Disruptor': 250,
    'Phoenix': 200,
    'VoidRay': 300,
    'Oracle': 250,
    'Tempest': 450,
    'Carrier': 500,
    'Mothership': 600,

    // Zerg units
    'Drone': 50,
    'Zergling': 25,
    'Baneling': 50,
    'Roach': 100,
    'Ravager': 175,
    'Hydralisk': 125,
    'Lurker': 250,
    'Infestor': 175,
    'SwarmHost': 150,
    'Ultralisk': 400,
    'Mutalisk': 150,
    'Corruptor': 200,
    'BroodLord': 325,
    'Viper': 275,
  };

  return unitCosts[unitName] || 100; // default 100 if not found
}

export function extractBattles(
  trackerEvents: TrackerEvent[],
  players: Player[]
): Battle[] {
  // First, build a map of units from birth events
  interface UnitInfo {
    unitName: string;
    playerId: number;
  }

  const unitMap = new Map<string, UnitInfo>(); // key: `${tagIndex}_${tagRecycle}`

  // Collect units from both SUnitBornEvent and SUnitInitEvent
  for (const event of trackerEvents) {
    if (event.eventType === 'NNet.Replay.Tracker.SUnitBornEvent') {
      const unitTypeName = (event as unknown as { m_unitTypeName?: string }).m_unitTypeName;
      const controlPlayerId = (event as unknown as { m_controlPlayerId?: number }).m_controlPlayerId;
      const tagIndex = (event as unknown as { m_unitTagIndex?: number }).m_unitTagIndex;
      const tagRecycle = (event as unknown as { m_unitTagRecycle?: number }).m_unitTagRecycle;

      if (unitTypeName && controlPlayerId !== undefined && tagIndex !== undefined && tagRecycle !== undefined) {
        const key = `${tagIndex}_${tagRecycle}`;
        unitMap.set(key, {
          unitName: unitTypeName,
          playerId: controlPlayerId,
        });
      }
    } else if (event.eventType === 'NNet.Replay.Tracker.SUnitInitEvent') {
      const unitTypeName = (event as unknown as { m_unitTypeName?: string }).m_unitTypeName;
      const controlPlayerId = (event as unknown as { m_controlPlayerId?: number }).m_controlPlayerId;
      const tagIndex = (event as unknown as { m_unitTagIndex?: number }).m_unitTagIndex;
      const tagRecycle = (event as unknown as { m_unitTagRecycle?: number }).m_unitTagRecycle;

      if (unitTypeName && controlPlayerId !== undefined && tagIndex !== undefined && tagRecycle !== undefined) {
        const key = `${tagIndex}_${tagRecycle}`;
        unitMap.set(key, {
          unitName: unitTypeName,
          playerId: controlPlayerId,
        });
      }
    }
  }

  // Collect all unit death events
  interface DeathEvent {
    gameloop: number;
    unitName: string;
    playerId: number;
  }

  const deathEvents: DeathEvent[] = [];

  for (const event of trackerEvents) {
    if (event.eventType === 'NNet.Replay.Tracker.SUnitDiedEvent') {
      const tagIndex = (event as unknown as { m_unitTagIndex?: number }).m_unitTagIndex;
      const tagRecycle = (event as unknown as { m_unitTagRecycle?: number }).m_unitTagRecycle;
      const gameloop = event._gameloop;

      if (tagIndex !== undefined && tagRecycle !== undefined && gameloop !== undefined) {
        const key = `${tagIndex}_${tagRecycle}`;
        const unitInfo = unitMap.get(key);

        if (unitInfo && shouldTrackUnitForBattle(unitInfo.unitName)) {
          deathEvents.push({
            gameloop,
            unitName: unitInfo.unitName,
            playerId: unitInfo.playerId,
          });
        }
      }
    }
  }

  // Sort by gameloop
  deathEvents.sort((a, b) => a.gameloop - b.gameloop);

  // Group deaths into battles
  const battles: Battle[] = [];
  let currentBattle: {
    startGameloop: number;
    lastDeathGameloop: number;
    deaths: DeathEvent[];
  } | null = null;

  for (const death of deathEvents) {
    if (!currentBattle) {
      // Start new battle
      currentBattle = {
        startGameloop: death.gameloop,
        lastDeathGameloop: death.gameloop,
        deaths: [death],
      };
    } else {
      const gapSinceLastDeath = death.gameloop - currentBattle.lastDeathGameloop;

      if (gapSinceLastDeath <= BATTLE_GAP_LOOPS) {
        // Continue current battle
        currentBattle.deaths.push(death);
        currentBattle.lastDeathGameloop = death.gameloop;
      } else {
        // End current battle and start new one
        const battle = createBattle(currentBattle);
        if (currentBattle.deaths.length >= 2 && battle.duration > 0) {
          // Only count battles with at least 2 deaths and duration > 0
          battles.push(battle);
        }

        currentBattle = {
          startGameloop: death.gameloop,
          lastDeathGameloop: death.gameloop,
          deaths: [death],
        };
      }
    }
  }

  // Don't forget the last battle
  if (currentBattle && currentBattle.deaths.length >= 2) {
    const battle = createBattle(currentBattle);
    if (battle.duration > 0) {
      battles.push(battle);
    }
  }

  console.log('Battles detected:', battles);

  return battles;
}

function createBattle(battleData: {
  startGameloop: number;
  lastDeathGameloop: number;
  deaths: { gameloop: number; unitName: string; playerId: number }[];
}): Battle {
  const startTime = gameLoopToSeconds(battleData.startGameloop);
  const endTime = gameLoopToSeconds(battleData.lastDeathGameloop);
  const duration = endTime - startTime;

  const unitsLost: BattleUnit[] = battleData.deaths.map(death => ({
    unitName: death.unitName,
    playerId: death.playerId,
    resourceValue: getUnitResourceValue(death.unitName),
    isBuilding: isBuilding(death.unitName),
  }));

  // Calculate total resources lost by each player
  const resourcesLostByPlayer = new Map<number, number>();
  for (const unit of unitsLost) {
    const current = resourcesLostByPlayer.get(unit.playerId) || 0;
    resourcesLostByPlayer.set(unit.playerId, current + unit.resourceValue);
  }

  return {
    startTime,
    endTime,
    startTimeLabel: formatTime(startTime),
    endTimeLabel: formatTime(endTime),
    duration,
    unitsLost,
    resourcesLostByPlayer,
  };
}

function isBuilding(unitName: string): boolean {
  const buildings = [
    'CommandCenter', 'OrbitalCommand', 'PlanetaryFortress', 'SupplyDepot',
    'Refinery', 'Barracks', 'Factory', 'Starport', 'EngineeringBay',
    'MissileTurret', 'Bunker', 'SensorTower', 'Armory', 'FusionCore',
    'Nexus', 'Pylon', 'Assimilator', 'Gateway', 'Forge', 'PhotonCannon',
    'CyberneticsCore', 'ShieldBattery', 'RoboticsFacility', 'Stargate',
    'TwilightCouncil', 'TemplarArchive', 'DarkShrine', 'RoboticsBay',
    'FleetBeacon', 'Hatchery', 'Lair', 'Hive', 'Extractor', 'SpawningPool',
    'EvolutionChamber', 'RoachWarren', 'BanelingNest', 'SpineCrawler',
    'SporeCrawler', 'HydraliskDen', 'LurkerDen', 'InfestationPit',
    'Spire', 'NydusNetwork', 'UltraliskCavern',
  ];

  return buildings.includes(unitName);
}

function shouldTrackUnitForBattle(unitName: string): boolean {
  // Exclude workers
  if (['SCV', 'Probe', 'Drone'].includes(unitName)) {
    return false;
  }

  // Exclude Beacon units
  if (unitName.startsWith('Beacon')) {
    return false;
  }

  return true;
}
