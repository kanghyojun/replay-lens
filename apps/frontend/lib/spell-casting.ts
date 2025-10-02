import type { GameEvent, TrackerEvent } from 'sc2ts';

export interface SpellCast {
  spellName: string;
  gameLoop: number;
  playerId: number;
  targetType: 'none' | 'point' | 'unit';
  targetUnitTag?: number;
  targetUnitName?: string;
  targetX?: number;
  targetY?: number;
}

export interface SpellCastingTimeline {
  time: number; // in seconds
  timeLabel: string; // "MM:SS"
  players: Map<number, SpellCast[]>; // playerId -> SpellCast[]
}

const GAME_LOOPS_PER_SECOND = 22.4;
const SEVEN_MINUTES_IN_LOOPS = 7 * 60 * GAME_LOOPS_PER_SECOND;

// Ability IDs for tracked spells
// These are based on StarCraft 2 protocol ability IDs
const TRACKED_ABILITIES: Record<number, string> = {
  723: 'ChronoBoost', // Protoss Chrono Boost
  3755: 'ChronoBoostEnergyCost', // Alternative Chrono Boost
  1819: 'BatteryOvercharge', // Protoss Battery Overcharge
  // Zerg abilities (to be confirmed)
  251: 'InjectLarva', // Zerg Inject Larva
  // Terran abilities (to be confirmed)
  171: 'CalldownMULE', // Terran Calldown MULE
};

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

// Find unit name by tag index and recycle in tracker events
function findUnitNameByTagParts(
  index: number,
  recycle: number,
  gameLoop: number,
  trackerEvents: TrackerEvent[]
): string | undefined {
  let unitName: string | undefined;

  for (const event of trackerEvents) {
    if (event._gameloop > gameLoop) break;

    if (
      event.eventType === 'NNet.Replay.Tracker.SUnitBornEvent' ||
      event.eventType === 'NNet.Replay.Tracker.SUnitInitEvent'
    ) {
      const unitTagIndex = (event as any).m_unitTagIndex;
      const unitTagRecycle = (event as any).m_unitTagRecycle;
      const unitTypeName = (event as any).m_unitTypeName;

      // Match both index and recycle
      if (unitTagIndex === index && unitTagRecycle === recycle && unitTypeName) {
        unitName = unitTypeName;
      }
    }
  }

  return unitName;
}

export function extractSpellCasting(
  gameEvents: GameEvent[],
  trackerEvents: TrackerEvent[]
): SpellCastingTimeline[] {
  const spellCasts: SpellCast[] = [];

  console.log('Total game events:', gameEvents.length);

  // Extract ability command events
  for (const event of gameEvents) {
    if (!event._gameloop) continue;

    // Only process SCmdEvent
    if (event.eventType !== 'NNet.Game.SCmdEvent') continue;

    const abilData = (event as any).m_abil;
    if (!abilData) continue;

    const abilLink = abilData.m_abilLink;
    const abilCmdIndex = abilData.m_abilCmdIndex;

    if (abilLink === undefined) continue;

    // Check if this is a tracked ability
    const spellName = TRACKED_ABILITIES[abilLink];
    if (!spellName) continue;

    let playerId = typeof event._userid === 'number' ? event._userid : (event._userid as any)?.m_userId;
    if (playerId === undefined) continue;

    // gameEvents use 0-based userId (0, 1), but build order uses 1-based (1, 2)
    // Convert to 1-based to match build order timeline
    playerId = playerId + 1;

    const gameLoop = event._gameloop;

    // Determine target type and extract target information from m_data
    let targetType: 'none' | 'point' | 'unit' = 'none';
    let targetUnitTag: number | undefined;
    let targetUnitName: string | undefined;
    let targetX: number | undefined;
    let targetY: number | undefined;

    const data = (event as any).m_data;
    if (data) {
      if (data.TargetPoint) {
        targetType = 'point';
        targetX = data.TargetPoint.x;
        targetY = data.TargetPoint.y;
      } else if (data.TargetUnit) {
        targetType = 'unit';

        // m_tag is the actual unit tag (unique ID)
        targetUnitTag = data.TargetUnit.m_tag;

        // Extract index and recycle from m_tag
        // SC2 tags are: (index << 18) | recycle
        const tagRecycle = targetUnitTag & 0x3FFFF; // Lower 18 bits
        const tagIndex = (targetUnitTag >> 18) & 0x3FFF; // Upper 14 bits

        targetUnitName = findUnitNameByTagParts(tagIndex, tagRecycle, gameLoop, trackerEvents);
      }
    }

    spellCasts.push({
      spellName,
      gameLoop,
      playerId,
      targetType,
      targetUnitTag,
      targetUnitName,
      targetX,
      targetY,
    });
  }

  console.log('Spell casts found:', spellCasts.length);
  if (spellCasts.length > 0) {
    console.log('First few spell casts:', spellCasts.slice(0, 5));
  }

  // Group spell casts by time buckets
  const timelineBuckets = new Map<number, SpellCastingTimeline>();

  for (const spellCast of spellCasts) {
    const bucketTime = getBucketTime(spellCast.gameLoop);

    if (!timelineBuckets.has(bucketTime)) {
      timelineBuckets.set(bucketTime, {
        time: bucketTime,
        timeLabel: formatTime(bucketTime),
        players: new Map(),
      });
    }

    const timeline = timelineBuckets.get(bucketTime)!;

    if (!timeline.players.has(spellCast.playerId)) {
      timeline.players.set(spellCast.playerId, []);
    }

    timeline.players.get(spellCast.playerId)!.push(spellCast);
  }

  // Convert to sorted array
  const timeline = Array.from(timelineBuckets.values()).sort((a, b) => a.time - b.time);

  console.log('Spell casting timeline buckets:', timeline.length);

  return timeline;
}

// Get display name for spell
export function getSpellDisplayName(spellName: string): string {
  const displayNames: Record<string, string> = {
    'ChronoBoost': 'Chrono Boost',
    'ChronoBoostEnergyCost': 'Chrono Boost',
    'BatteryOvercharge': 'Battery Overcharge',
    'InjectLarva': 'Inject Larva',
    'CalldownMULE': 'MULE',
  };

  return displayNames[spellName] || spellName;
}

// Get abbreviated spell name
export function getSpellAbbreviation(spellName: string): string {
  const abbreviations: Record<string, string> = {
    'ChronoBoost': 'CB',
    'ChronoBoostEnergyCost': 'CB',
    'BatteryOvercharge': 'BO',
    'InjectLarva': 'IL',
    'CalldownMULE': 'MULE',
  };

  return abbreviations[spellName] || spellName.slice(0, 2);
}
