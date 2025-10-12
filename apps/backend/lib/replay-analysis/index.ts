import type { TrackerEvent, GameEvent, Player } from 'sc2ts';
import type { ReplayAnalysis } from './types';
import { extractArmyComposition } from './army-composition';
import { extractSupplyBlocks } from './supply-block';
import { extractEconomy } from './economy';
import { extractBattles } from './battle';
import { extractSpellCasting } from './spell-casting';
import { extractBuildOrder } from './build-order';

/**
 * Analyzes a replay and extracts all statistics
 * @param trackerEvents - Tracker events from the replay
 * @param gameEvents - Game events from the replay
 * @param players - Player information from the replay
 * @returns Complete replay analysis with all statistics
 */
export function analyzeReplay(
  trackerEvents: TrackerEvent[],
  gameEvents: GameEvent[],
  players: Player[]
): ReplayAnalysis {
  console.log('Starting replay analysis...');
  console.log('Players:', players.length);
  console.log('Tracker events:', trackerEvents.length);
  console.log('Game events:', gameEvents.length);

  const analysis: ReplayAnalysis = {
    armyComposition: extractArmyComposition(trackerEvents, players),
    supplyBlocks: extractSupplyBlocks(trackerEvents, players),
    economy: extractEconomy(trackerEvents, players),
    battles: extractBattles(trackerEvents, players),
    spellCasting: extractSpellCasting(gameEvents, trackerEvents),
    buildOrder: extractBuildOrder(trackerEvents, players),
  };

  console.log('Replay analysis complete!');
  console.log('- Army composition snapshots:', analysis.armyComposition.length);
  console.log('- Supply block timelines:', analysis.supplyBlocks.length);
  console.log('- Economy timelines:', analysis.economy.length);
  console.log('- Battles detected:', analysis.battles.length);
  console.log('- Spell casting timelines:', analysis.spellCasting.length);
  console.log('- Build order timelines:', analysis.buildOrder.length);

  return analysis;
}

// Re-export types and individual functions for convenience
export * from './types';
export { extractArmyComposition } from './army-composition';
export { extractSupplyBlocks } from './supply-block';
export { extractEconomy } from './economy';
export { extractBattles } from './battle';
export { extractSpellCasting } from './spell-casting';
export { extractBuildOrder } from './build-order';
