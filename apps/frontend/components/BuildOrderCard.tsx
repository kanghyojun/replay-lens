'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { extractBuildOrder, abbreviateUnitName, abbreviateUpgradeName } from '@/lib/build-order';
import { getPlayerColor } from '@/lib/player-colors';
import type { TrackerEvent, Player } from 'sc2ts';

interface BuildOrderCardProps {
  trackerEvents: TrackerEvent[];
  players: Player[];
}

export function BuildOrderCard({ trackerEvents, players }: BuildOrderCardProps) {
  const timeline = extractBuildOrder(trackerEvents, players);
  const [showAll, setShowAll] = useState(false);

  // Player IDs in tracker events are 1-based indices
  const playerIds = players.map((_, idx) => idx + 1);

  const INITIAL_ROWS = 8;
  const displayedTimeline = showAll ? timeline : timeline.slice(0, INITIAL_ROWS);
  const hasMore = timeline.length > INITIAL_ROWS;

  console.log('Players:', players);
  console.log('Player IDs:', playerIds);
  console.log('Timeline length:', timeline.length);

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
        <CardTitle>Build Order</CardTitle>
        <CardDescription>Units, buildings, and upgrades timeline</CardDescription>
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
              {displayedTimeline.map((timeSlot, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono font-bold align-top">
                    {timeSlot.timeLabel}
                  </TableCell>
                  {playerIds.map((playerId) => {
                    const playerItems = timeSlot.players.get(playerId);

                    if (!playerItems || (playerItems.buildings.size === 0 && playerItems.units.size === 0 && playerItems.upgrades.size === 0)) {
                      return (
                        <TableCell key={playerId} className="align-top">
                          <div className="min-h-[60px]" />
                        </TableCell>
                      );
                    }

                    const hasBuildings = playerItems.buildings.size > 0;
                    const hasUnits = playerItems.units.size > 0;
                    const hasUpgrades = playerItems.upgrades.size > 0;

                    return (
                      <TableCell key={playerId} className="align-top">
                        <div className="flex flex-col gap-3">
                          {/* Buildings */}
                          {hasBuildings && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Buildings</div>
                              <div className="flex flex-wrap gap-1">
                                {Array.from(playerItems.buildings.entries()).map(([buildingName, count]) => (
                                  <Tooltip key={buildingName}>
                                    <TooltipTrigger asChild>
                                      <div className="relative w-[60px] h-[60px] border border-amber-600 bg-amber-900/30 rounded flex items-center justify-center cursor-help hover:bg-amber-900/50 transition-colors">
                                        <span className="text-sm font-bold text-amber-100">
                                          {abbreviateUnitName(buildingName)}
                                        </span>
                                        {count > 1 && (
                                          <span className="absolute bottom-0 right-0 bg-amber-600 text-white text-xs font-bold px-1 rounded-tl">
                                            {count}
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{buildingName} {count > 1 ? `(×${count})` : ''}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Units */}
                          {hasUnits && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Units</div>
                              <div className="flex flex-wrap gap-1">
                                {Array.from(playerItems.units.entries()).map(([unitName, count]) => (
                                  <Tooltip key={unitName}>
                                    <TooltipTrigger asChild>
                                      <div className="relative w-[60px] h-[60px] border border-blue-600 bg-blue-900/30 rounded flex items-center justify-center cursor-help hover:bg-blue-900/50 transition-colors">
                                        <span className="text-sm font-bold text-blue-100">
                                          {abbreviateUnitName(unitName)}
                                        </span>
                                        {count > 1 && (
                                          <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-bold px-1 rounded-tl">
                                            {count}
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{unitName} {count > 1 ? `(×${count})` : ''}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Upgrades */}
                          {hasUpgrades && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Upgrades</div>
                              <div className="flex flex-wrap gap-1">
                                {Array.from(playerItems.upgrades.entries()).map(([upgradeName, count]) => (
                                  <Tooltip key={upgradeName}>
                                    <TooltipTrigger asChild>
                                      <div className="relative w-[60px] h-[60px] border border-green-600 bg-green-900/30 rounded flex items-center justify-center cursor-help hover:bg-green-900/50 transition-colors">
                                        <span className="text-sm font-bold text-green-100">
                                          {abbreviateUpgradeName(upgradeName)}
                                        </span>
                                        {count > 1 && (
                                          <span className="absolute bottom-0 right-0 bg-green-600 text-white text-xs font-bold px-1 rounded-tl">
                                            {count}
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{upgradeName} {count > 1 ? `(×${count})` : ''}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>
                          )}
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
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View All ({timeline.length} rows)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
