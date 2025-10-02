'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewAllButton } from '@/components/ViewAllButton';
import { extractSupplyBlocks } from '@/lib/supply-block';
import { getPlayerColor } from '@/lib/player-colors';
import type { TrackerEvent, Player } from 'sc2ts';
import { useState } from 'react';

interface SupplyBlockCardProps {
  trackerEvents: TrackerEvent[];
  players: Player[];
}

export function SupplyBlockCard({ trackerEvents, players }: SupplyBlockCardProps) {
  const timelines = extractSupplyBlocks(trackerEvents, players);
  const [showAll, setShowAll] = useState(false);

  // Player IDs in tracker events are 1-based indices
  const playerIds = players.map((_, idx) => idx + 1);

  // Combine all blocks from all players and sort by start time
  const allBlocks = timelines.flatMap(timeline =>
    timeline.blocks.map(block => ({
      ...block,
      playerId: timeline.playerId,
    }))
  ).sort((a, b) => a.startTime - b.startTime);

  const INITIAL_ROWS = 8;
  const displayedBlocks = showAll ? allBlocks : allBlocks.slice(0, INITIAL_ROWS);
  const hasMore = allBlocks.length > INITIAL_ROWS;

  if (allBlocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supply Blocks</CardTitle>
          <CardDescription>Times when players were supply blocked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No supply blocks detected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply Blocks</CardTitle>
        <CardDescription>Times when players were supply blocked (minimum 1 second)</CardDescription>
      </CardHeader>
      <CardContent>
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
              {displayedBlocks.map((block, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono font-bold align-top">
                    {block.startTimeLabel}
                  </TableCell>
                  {playerIds.map((playerId) => {
                    if (playerId === block.playerId) {
                      return (
                        <TableCell key={playerId} className="align-top">
                          <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-red-950/50 border border-red-700/50 rounded">
                            <span className="text-xl font-black text-red-50">
                              {block.supply}/{block.supply}
                            </span>
                            <span className="text-sm font-semibold text-red-200">
                              ({block.duration}s)
                            </span>
                          </div>
                        </TableCell>
                      );
                    } else {
                      return (
                        <TableCell key={playerId} className="align-top">
                          <div className="text-sm text-muted-foreground">-</div>
                        </TableCell>
                      );
                    }
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {hasMore && (
          <ViewAllButton
            showAll={showAll}
            onToggle={() => setShowAll(!showAll)}
            totalCount={allBlocks.length}
          />
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            {timelines.map((timeline, idx) => {
              const player = players[idx];
              return (
                <div key={timeline.playerId} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPlayerColor(idx) }}
                    />
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {timeline.blocks.length} block{timeline.blocks.length !== 1 ? 's' : ''}
                    </div>
                    <div className="font-bold text-red-400">
                      {timeline.totalBlockTime}s total
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
