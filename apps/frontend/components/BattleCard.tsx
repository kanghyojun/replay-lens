'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewAllButton } from '@/components/ViewAllButton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UnitIcon } from '@/components/UnitIcon';
import { getPlayerColor } from '@repo/sc2-utils/player-colors';
import type { Player } from 'sc2ts';
import type { Battle } from '@/lib/replay-analysis-types';
import { Swords } from 'lucide-react';
import { useState } from 'react';

interface BattleCardProps {
  battles: Battle[];
  players: Player[];
}

export function BattleCard({ battles, players }: BattleCardProps) {
  const [showAll, setShowAll] = useState(false);

  const formatNumber = (num: number) => num.toLocaleString();

  if (battles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Battles
          </CardTitle>
          <CardDescription>Major engagements detected during the match</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No battles detected
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayLimit = showAll ? battles.length : Math.min(8, battles.length);
  const hasMore = battles.length > 8;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5" />
          Battles
        </CardTitle>
        <CardDescription>
          Major engagements detected during the match ({battles.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 font-bold">Time</TableHead>
                  {players.map((player, idx) => (
                    <TableHead key={idx} className="min-w-[200px]">
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
                {battles.slice(0, displayLimit).map((battle, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono font-bold align-top">
                      {battle.startTimeLabel}
                      <div className="text-xs text-muted-foreground mt-1">
                        {battle.duration}s
                      </div>
                    </TableCell>
                    {players.map((player, playerIdx) => {
                      const playerId = playerIdx + 1; // Player IDs are 1-based
                      const unitsLostByPlayer = battle.unitsLost.filter(
                        unit => unit.playerId === playerId
                      );
                      const resourcesLost = battle.resourcesLostByPlayer[playerId] || 0;

                      if (unitsLostByPlayer.length === 0) {
                        return (
                          <TableCell key={playerId} className="align-top">
                            <div className="min-h-[60px]" />
                          </TableCell>
                        );
                      }

                      // Separate buildings and units
                      const buildingCounts = new Map<string, number>();
                      const unitCounts = new Map<string, number>();

                      unitsLostByPlayer.forEach(unit => {
                        if (unit.isBuilding) {
                          buildingCounts.set(unit.unitName, (buildingCounts.get(unit.unitName) || 0) + 1);
                        } else {
                          unitCounts.set(unit.unitName, (unitCounts.get(unit.unitName) || 0) + 1);
                        }
                      });

                      const hasBuildings = buildingCounts.size > 0;
                      const hasUnits = unitCounts.size > 0;

                      return (
                        <TableCell key={playerId} className="align-top">
                          <div className="flex flex-col gap-3">
                            {/* Buildings lost */}
                            {hasBuildings && (
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground mb-1">
                                  Buildings Lost
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {Array.from(buildingCounts.entries()).map(([buildingName, count]) => (
                                    <UnitIcon key={buildingName} name={buildingName} count={count} type="building" />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Units lost */}
                            {hasUnits && (
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground mb-1">
                                  Units Lost
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {Array.from(unitCounts.entries()).map(([unitName, count]) => (
                                    <UnitIcon key={unitName} name={unitName} count={count} type="unit" />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Total resources lost */}
                            <div className="text-sm">
                              <span className="text-muted-foreground">Resources: </span>
                              <span className="font-bold text-red-400">
                                {formatNumber(resourcesLost)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>

        {hasMore && (
          <ViewAllButton
            showAll={showAll}
            onToggle={() => setShowAll(!showAll)}
            totalCount={battles.length}
          />
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Battle Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            {players.map((player, idx) => {
              const playerId = idx + 1;

              // Calculate total losses
              let totalUnitsLost = 0;
              let totalResourcesLost = 0;

              battles.forEach(battle => {
                const unitsInBattle = battle.unitsLost.filter(u => u.playerId === playerId);
                totalUnitsLost += unitsInBattle.length;
                totalResourcesLost += battle.resourcesLostByPlayer[playerId] || 0;
              });

              return (
                <div
                  key={playerId}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPlayerColor(idx) }}
                    />
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {totalUnitsLost} units lost
                    </div>
                    <div className="font-bold text-red-400">
                      {formatNumber(totalResourcesLost)} resources
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
