'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { extractEconomy } from '@/lib/economy';
import { getPlayerColor } from '@/lib/player-colors';
import type { TrackerEvent, Player } from 'sc2ts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface EconomyAnalysisCardProps {
  trackerEvents: TrackerEvent[];
  players: Player[];
}

export function EconomyAnalysisCard({ trackerEvents, players }: EconomyAnalysisCardProps) {
  const timelines = extractEconomy(trackerEvents, players);
  const [showAll, setShowAll] = useState(false);

  const formatNumber = (num: number) => num.toLocaleString();

  // Find the maximum number of snapshots across all players
  const maxSnapshots = Math.max(...timelines.map(t => t.snapshots.length));

  if (maxSnapshots === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Economy Analysis</CardTitle>
          <CardDescription>Resource collection and spending per minute</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No economy data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayLimit = showAll ? maxSnapshots : Math.min(8, maxSnapshots);
  const hasMore = maxSnapshots > 8;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Economy Analysis</CardTitle>
        <CardDescription>Resource collection and spending per minute</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 font-bold">Time</TableHead>
                {players.map((player, idx) => (
                  <TableHead key={idx} className="min-w-[250px]">
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
              {Array.from({ length: displayLimit }).map((_, idx) => {
                const intervalSeconds = (idx + 1) * 30;
                const minutes = Math.floor(intervalSeconds / 60);
                const seconds = intervalSeconds % 60;
                const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                return (
                  <TableRow key={idx}>
                    <TableCell className="font-mono font-bold align-top">
                      {timeLabel}
                    </TableCell>
                    {timelines.map((timeline) => {
                      const snapshotData = timeline.snapshots[idx];
                      if (!snapshotData) {
                        return (
                          <TableCell key={timeline.playerId} className="align-top">
                            <div className="text-sm text-muted-foreground">-</div>
                          </TableCell>
                        );
                      }

                      // Calculate unspent resources (collection rate is per minute, so it's already the collected amount for this minute)
                      const mineralsCollected = snapshotData.mineralsCollectionRate;
                      const vespeneCollected = snapshotData.vespeneCollectionRate;
                      const mineralsUnspent = mineralsCollected - snapshotData.mineralsUsedDelta;
                      const vespeneUnspent = vespeneCollected - snapshotData.vespeneUsedDelta;

                      return (
                        <TableCell key={timeline.playerId} className="align-top">
                          <div className="space-y-2 font-mono">
                            {/* Minerals */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground w-12">Min:</span>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-20 text-right">+{formatNumber(mineralsCollected)}</span>
                                <span className="w-20 text-right">-{formatNumber(snapshotData.mineralsUsedDelta)}</span>
                                <span className={`w-24 text-right font-bold ${mineralsUnspent >= 0 ? "text-blue-400" : "text-red-400"}`}>
                                  ({mineralsUnspent >= 0 ? '+' : ''}{formatNumber(mineralsUnspent)})
                                </span>
                              </div>
                            </div>

                            {/* Vespene */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground w-12">Gas:</span>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-20 text-right">+{formatNumber(vespeneCollected)}</span>
                                <span className="w-20 text-right">-{formatNumber(snapshotData.vespeneUsedDelta)}</span>
                                <span className={`w-24 text-right font-bold ${vespeneUnspent >= 0 ? "text-blue-400" : "text-red-400"}`}>
                                  ({vespeneUnspent >= 0 ? '+' : ''}{formatNumber(vespeneUnspent)})
                                </span>
                              </div>
                            </div>

                            {/* Current Bank */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground w-12">Bank:</span>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-20 text-right">{formatNumber(snapshotData.mineralsCurrent)}</span>
                                <span className="w-20 text-right">{formatNumber(snapshotData.vespeneCurrent)}</span>
                              </div>
                            </div>
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

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="gap-2"
            >
              {showAll ? (
                <>
                  Show Less
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  View All
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Final Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timelines.map((timeline, idx) => {
              const player = players[idx];
              const lastSnapshot = timeline.snapshots[timeline.snapshots.length - 1];

              if (!lastSnapshot) return null;

              // Calculate average unspent resources
              let totalMineralsUnspent = 0;
              let totalVespeneUnspent = 0;
              timeline.snapshots.forEach(snapshot => {
                const mineralsUnspent = snapshot.mineralsCollectionRate - snapshot.mineralsUsedDelta;
                const vespeneUnspent = snapshot.vespeneCollectionRate - snapshot.vespeneUsedDelta;
                totalMineralsUnspent += mineralsUnspent;
                totalVespeneUnspent += vespeneUnspent;
              });
              const avgMineralsUnspent = Math.round(totalMineralsUnspent / timeline.snapshots.length);
              const avgVespeneUnspent = Math.round(totalVespeneUnspent / timeline.snapshots.length);

              return (
                <div key={timeline.playerId} className="p-4 bg-muted/50 rounded space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPlayerColor(idx) }}
                    />
                    <span className="font-medium">{player.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Minerals Spending:</span>
                      <div className="font-bold">{formatNumber(lastSnapshot.mineralsUsedTotal)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vespene Spending:</span>
                      <div className="font-bold">{formatNumber(lastSnapshot.vespeneUsedTotal)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Unspent Minerals:</span>
                      <div className={`font-bold ${avgMineralsUnspent >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {avgMineralsUnspent >= 0 ? '+' : ''}{formatNumber(avgMineralsUnspent)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Unspent Vespene:</span>
                      <div className={`font-bold ${avgVespeneUnspent >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {avgVespeneUnspent >= 0 ? '+' : ''}{formatNumber(avgVespeneUnspent)}
                      </div>
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
