// Replay analysis types (shared between backend and frontend)
// Backend computes these, frontend consumes them

// Army Composition Types
export interface ArmyCompositionSnapshot {
  time: number; // in seconds
  timeLabel: string; // "MM:SS"
  players: Record<number, Record<string, number>>; // playerId -> unitName -> count
}

// Supply Block Types
export interface SupplyBlock {
  startTime: number;
  endTime: number;
  startTimeLabel: string;
  endTimeLabel: string;
  duration: number;
  supply: number;
}

export interface SupplyBlockTimeline {
  playerId: number;
  blocks: SupplyBlock[];
  totalBlockTime: number;
}

// Economy Types
export interface EconomySnapshot {
  time: number;
  timeLabel: string;
  mineralsCurrent: number;
  vespeneCurrent: number;
  mineralsCollectionRate: number;
  vespeneCollectionRate: number;
  mineralsUsedTotal: number;
  vespeneUsedTotal: number;
  mineralsLostTotal: number;
  vespeneLostTotal: number;
  workersActive: number;
  mineralsUsedDelta: number;
  vespeneUsedDelta: number;
}

export interface EconomyTimeline {
  playerId: number;
  snapshots: EconomySnapshot[];
}

// Battle Types
export interface BattleUnit {
  unitName: string;
  playerId: number;
  resourceValue: number;
  isBuilding: boolean;
}

export interface Battle {
  startTime: number;
  endTime: number;
  startTimeLabel: string;
  endTimeLabel: string;
  duration: number;
  unitsLost: BattleUnit[];
  resourcesLostByPlayer: Record<number, number>; // playerId -> total resource value lost
}

// Spell Casting Types
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
  time: number;
  timeLabel: string;
  players: Record<number, SpellCast[]>; // playerId -> SpellCast[]
}

// Build Order Types
export interface BuildOrderItem {
  buildings: Record<string, number>; // buildingName -> count
  units: Record<string, number>; // unitName -> count
  upgrades: Record<string, number>; // upgradeName -> count
}

export interface BuildOrderTimeline {
  time: number;
  timeLabel: string;
  players: Record<number, BuildOrderItem>; // playerId -> BuildOrderItem
}

// Combined Analysis Result
export interface ReplayAnalysis {
  armyComposition: ArmyCompositionSnapshot[];
  supplyBlocks: SupplyBlockTimeline[];
  economy: EconomyTimeline[];
  battles: Battle[];
  spellCasting: SpellCastingTimeline[];
  buildOrder: BuildOrderTimeline[];
}
