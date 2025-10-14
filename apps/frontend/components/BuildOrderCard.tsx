'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { ViewAllButton } from '@/components/ViewAllButton';
import { UnitIcon } from '@/components/UnitIcon';
import { getSpellDisplayName, getSpellAbbreviation } from '@repo/sc2-utils/spell-utils';
import { getPlayerColor } from '@repo/sc2-utils/player-colors';
import type { Player } from 'sc2ts';
import type { BuildOrderTimeline, SpellCastingTimeline, SpellCast } from '@/lib/replay-analysis-types';

interface BuildOrderCardProps {
  buildOrder: BuildOrderTimeline[];
  spellCasting: SpellCastingTimeline[];
  players: Player[];
}

export function BuildOrderCard({ buildOrder, spellCasting, players }: BuildOrderCardProps) {
  const [showAll, setShowAll] = useState(false);
  const [showSpells, setShowSpells] = useState(true);
  const [selectedSpell, setSelectedSpell] = useState<SpellCast | null>(null);

  // Merge build order timeline with spell timeline
  const timeline = useMemo(() => {
    const merged = new Map<string, typeof buildOrder[0]>();

    // Add all build order entries
    buildOrder.forEach(entry => {
      merged.set(entry.timeLabel, entry);
    });

    // Add spell timeline entries (or merge with existing)
    spellCasting.forEach(spellEntry => {
      if (merged.has(spellEntry.timeLabel)) {
        // Entry already exists, we'll handle spells separately in rendering
      } else {
        // Create new entry for spell-only time slot
        merged.set(spellEntry.timeLabel, {
          time: spellEntry.time,
          timeLabel: spellEntry.timeLabel,
          players: {},
        });
      }
    });

    // Convert to sorted array
    return Array.from(merged.values()).sort((a, b) => a.time - b.time);
  }, [buildOrder, spellCasting]);

  // Player IDs in tracker events are 1-based indices
  const playerIds = players.map((_, idx) => idx + 1);

  // Helper function to get spells for a specific time bucket and player
  const getSpellsForTimeAndPlayer = useCallback((timeLabel: string, playerId: number) => {
    const spellBucket = spellCasting.find(bucket => bucket.timeLabel === timeLabel);
    const spells = spellBucket?.players[playerId] || [];

    if (spells.length > 0) {
      console.log(`Found ${spells.length} spells at ${timeLabel} for player ${playerId}:`, spells);
    }

    return spells;
  }, [spellCasting]);

  // Filter out timeline slots that would be completely empty
  const filteredTimeline = useMemo(() => {
    return timeline.filter(timeSlot => {
      // Check if any player has content at this time
      for (const playerId of playerIds) {
        const playerItems = timeSlot.players[playerId];
        const spells = showSpells ? getSpellsForTimeAndPlayer(timeSlot.timeLabel, playerId) : [];

        const hasBuildings = playerItems && Object.keys(playerItems.buildings).length > 0;
        const hasUnits = playerItems && Object.keys(playerItems.units).length > 0;
        const hasUpgrades = playerItems && Object.keys(playerItems.upgrades).length > 0;
        const hasSpells = spells.length > 0;

        if (hasBuildings || hasUnits || hasUpgrades || hasSpells) {
          return true;
        }
      }
      return false;
    });
  }, [timeline, showSpells, playerIds, getSpellsForTimeAndPlayer]);

  const INITIAL_ROWS = 8;
  const displayedTimeline = showAll ? filteredTimeline : filteredTimeline.slice(0, INITIAL_ROWS);
  const hasMore = filteredTimeline.length > INITIAL_ROWS;

  console.log('Players:', players);
  console.log('Player IDs:', playerIds);
  console.log('Timeline length:', timeline.length);
  console.log('Spell timeline length:', spellCasting.length);
  console.log('Show spells enabled:', showSpells);
  console.log('Displayed timeline count:', displayedTimeline.length);
  console.log('Displayed timeline labels:', displayedTimeline.map(t => t.timeLabel));
  if (spellCasting.length > 0) {
    console.log('First spell timeline bucket:', spellCasting[0]);
    console.log('Spell timeline player IDs:', Object.keys(spellCasting[0].players));
    console.log('All spell timeline labels:', spellCasting.map(t => t.timeLabel));
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Build Order</CardTitle>
          <CardDescription>Units, buildings, and upgrades timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No build order data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Build Order</CardTitle>
            <CardDescription>Units, buildings, and upgrades timeline</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="show-spells" className="text-sm font-medium cursor-pointer">
              Show Spell Casting
            </label>
            <Switch
              id="show-spells"
              checked={showSpells}
              onCheckedChange={setShowSpells}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 font-bold">Time</TableHead>
                {players.map((player, idx) => (
                  <TableHead key={idx} className="min-w-[300px]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPlayerColor(idx) }}
                      />
                      <span>{player.name}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTimeline.map((timeSlot, idx) => {
                // Debug log for 0:34
                if (timeSlot.timeLabel === '0:34') {
                  console.log('Rendering 0:34 row, checking for spells...');
                  playerIds.forEach(pid => {
                    const spells = showSpells ? getSpellsForTimeAndPlayer(timeSlot.timeLabel, pid) : [];
                    console.log(`  Player ${pid}: ${spells.length} spells`);
                  });
                }

                return (
                <TableRow key={idx}>
                  <TableCell className="font-mono font-bold align-top">
                    {timeSlot.timeLabel}
                  </TableCell>
                  {playerIds.map((playerId) => {
                    const playerItems = timeSlot.players[playerId];
                    const spells = showSpells ? getSpellsForTimeAndPlayer(timeSlot.timeLabel, playerId) : [];

                    const hasBuildings = playerItems && Object.keys(playerItems.buildings).length > 0;
                    const hasUnits = playerItems && Object.keys(playerItems.units).length > 0;
                    const hasUpgrades = playerItems && Object.keys(playerItems.upgrades).length > 0;
                    const hasSpells = spells.length > 0;

                    if (!hasBuildings && !hasUnits && !hasUpgrades && !hasSpells) {
                      return (
                        <TableCell key={playerId} className="align-top">
                          <div className="min-h-[60px]" />
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={playerId} className="align-top">
                        <div className="flex flex-col gap-3">
                          {/* Buildings */}
                          {hasBuildings && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Buildings</div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(playerItems!.buildings).map(([buildingName, count]) => (
                                  <UnitIcon key={buildingName} name={buildingName} count={count} type="building" />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Units */}
                          {hasUnits && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Units</div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(playerItems!.units).map(([unitName, count]) => (
                                  <UnitIcon key={unitName} name={unitName} count={count} type="unit" />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Upgrades */}
                          {hasUpgrades && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Upgrades</div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(playerItems!.upgrades).map(([upgradeName, count]) => (
                                  <UnitIcon key={upgradeName} name={upgradeName} count={count} type="upgrade" />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Spell Casting */}
                          {hasSpells && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Spells</div>
                              <div className="flex flex-wrap gap-1">
                                {spells.map((spell, spellIdx) => (
                                  <div key={spellIdx} className="relative">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`w-[60px] h-[60px] flex items-center justify-center text-xs font-bold rounded border ${
                                            spell.targetType === 'unit' || spell.targetType === 'point'
                                              ? 'cursor-pointer hover:bg-purple-500/20'
                                              : ''
                                          } bg-purple-500/10 text-purple-600 border-purple-500/50 transition-colors`}
                                          onClick={() => {
                                            if (spell.targetType === 'unit' || spell.targetType === 'point') {
                                              setSelectedSpell(selectedSpell?.spellName === spell.spellName && selectedSpell?.gameLoop === spell.gameLoop ? null : spell);
                                            }
                                          }}
                                        >
                                          {getSpellAbbreviation(spell.spellName)}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{getSpellDisplayName(spell.spellName)}</p>
                                      </TooltipContent>
                                    </Tooltip>

                                    {/* Target overlay */}
                                    {selectedSpell?.gameLoop === spell.gameLoop &&
                                     selectedSpell?.spellName === spell.spellName &&
                                     spell.targetType === 'unit' &&
                                     spell.targetUnitName && (
                                      <div className="absolute left-[68px] top-0 flex items-center gap-1 z-10 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <span className="text-lg text-purple-600">→</span>
                                        <UnitIcon
                                          name={spell.targetUnitName}
                                          count={1}
                                          type="building"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        </TooltipProvider>

        {hasMore && (
          <ViewAllButton
            showAll={showAll}
            onToggle={() => setShowAll(!showAll)}
            totalCount={filteredTimeline.length}
          />
        )}
      </CardContent>

    </Card>
  );
}
