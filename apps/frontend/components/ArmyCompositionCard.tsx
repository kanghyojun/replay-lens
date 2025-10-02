'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ViewAllButton } from '@/components/ViewAllButton';
import { UnitIcon } from '@/components/UnitIcon';
import { extractArmyComposition } from '@/lib/army-composition';
import { getPlayerColor } from '@/lib/player-colors';
import type { TrackerEvent, Player } from 'sc2ts';

interface ArmyCompositionCardProps {
  trackerEvents: TrackerEvent[];
  players: Player[];
}

export function ArmyCompositionCard({ trackerEvents, players }: ArmyCompositionCardProps) {
  const snapshots = extractArmyComposition(trackerEvents, players);
  const [showAll, setShowAll] = useState(false);

  // Player IDs in tracker events are 1-based indices
  const playerIds = players.map((_, idx) => idx + 1);

  const INITIAL_ROWS = 8;
  const displayedSnapshots = showAll ? snapshots : snapshots.slice(0, INITIAL_ROWS);
  const hasMore = snapshots.length > INITIAL_ROWS;

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Army Composition</CardTitle>
          <CardDescription>Unit composition throughout the game (1-minute intervals)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No army composition data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Army Composition</CardTitle>
        <CardDescription>Unit composition throughout the game (1-minute intervals)</CardDescription>
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
                {displayedSnapshots.map((snapshot, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono font-bold align-top">
                      {snapshot.timeLabel}
                    </TableCell>
                    {playerIds.map((playerId) => {
                      const units = snapshot.players.get(playerId);

                      if (!units || units.size === 0) {
                        return (
                          <TableCell key={playerId} className="align-top">
                            <div className="text-sm text-muted-foreground py-2">No units</div>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={playerId} className="align-top">
                          <div className="flex flex-wrap gap-1">
                            {Array.from(units.entries()).map(([unitName, count]) => (
                              <UnitIcon key={unitName} name={unitName} count={count} type="unit" />
                            ))}
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
            totalCount={snapshots.length}
          />
        )}
      </CardContent>
    </Card>
  );
}
