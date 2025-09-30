'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Target, TrendingUp } from 'lucide-react';

interface LadderEntry {
  ladderId: string;
  teamMembers: Array<{
    favoriteRace: string;
    name: string;
    displayName?: string;
    clanTag?: string;
    playerId?: string;
    region?: number;
  }>;
  localizedGameMode: string;
  gameMode: string;
  wins: number;
  losses: number;
  mmr?: number;
  rank: number;
  winRate: number;
  totalGames: number;
  league: string;
  leagueName?: string;
  localizedDivisionName?: string;
  points?: number;
  previousRank?: number;
  highestRank?: number;
  joinTimestamp?: number;
}

interface LadderData {
  ladders: LadderEntry[];
  placementMatches: any[];
  allMemberships: any[];
  profile: {
    name: string;
    regionName: string;
  };
}

export function LadderSummary() {
  const { user } = useAuth();
  const [ladderData, setLadderData] = useState<LadderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLadderSummary = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sc2/ladder`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ladder summary');
      }

      const data = await response.json();

      if (data.success) {
        console.log('Ladder data received:', data); // Debug log
        setLadderData(data);
      } else {
        throw new Error(data.error || 'Failed to fetch ladder summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLadderSummary();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const getLeagueColor = (league: string) => {
    const leagueUpper = league?.toUpperCase();
    switch (leagueUpper) {
      case 'GRANDMASTER': return 'bg-purple-500 text-white';
      case 'MASTER': return 'bg-blue-500 text-white';
      case 'DIAMOND': return 'bg-cyan-500 text-white';
      case 'PLATINUM': return 'bg-green-500 text-white';
      case 'GOLD': return 'bg-yellow-500 text-black';
      case 'SILVER': return 'bg-gray-400 text-white';
      case 'BRONZE': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getRaceIcon = (race: string) => {
    console.log('Race value received:', race); // Debug log
    const raceStr = race?.toLowerCase();
    switch (raceStr) {
      case 'protoss': return '⚡';
      case 'terran': return '🔧';
      case 'zerg': return '👾';
      case 'prot': return '⚡';
      case 'terr': return '🔧';
      case 'random': return '🎲';
      default:
        console.log('Unknown race:', race); // Debug unknown races
        return '❓';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ladder Summary</h2>
        <Button onClick={fetchLadderSummary} disabled={loading} size="sm">
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-sm mb-4 p-4 bg-destructive/10 rounded-lg">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      )}

      {ladderData && (
        <div className="grid gap-6">
          {ladderData.ladders.length > 0 ? (
            ladderData.ladders.map((ladder, index) => (
              <Card key={index} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span>{getRaceIcon(ladder.teamMembers?.[0]?.favoriteRace)}</span>
                      {ladder.gameMode}
                      {ladder.teamMembers?.[0]?.clanTag && (
                        <Badge variant="outline">
                          {ladder.teamMembers[0].clanTag}
                        </Badge>
                      )}
                    </CardTitle>
                    <Badge className={getLeagueColor(ladder.leagueName || ladder.league)}>
                      {ladder.leagueName || ladder.league}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Rank</div>
                        <div className="text-lg font-semibold">#{ladder.rank}</div>
                        {ladder.previousRank && ladder.previousRank !== ladder.rank && (
                          <div className="text-xs text-muted-foreground">
                            Previous: #{ladder.previousRank}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">MMR</div>
                        <div className="text-lg font-semibold">
                          {ladder.mmr ? ladder.mmr.toLocaleString() : 'Unranked'}
                        </div>
                        {ladder.points && (
                          <div className="text-xs text-muted-foreground">
                            Points: {ladder.points}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">W/L</div>
                        <div className="text-lg font-semibold">
                          <span className="text-green-500">{ladder.wins}</span>
                          /
                          <span className="text-red-500">{ladder.losses}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                        <div className="text-lg font-semibold">
                          {ladder.winRate}%
                        </div>
                        {ladder.highestRank && (
                          <div className="text-xs text-muted-foreground">
                            Peak: #{ladder.highestRank}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Total Games: {ladder.totalGames} •
                      Race: {ladder.teamMembers?.[0]?.favoriteRace || 'Unknown'} •
                      Player: {ladder.teamMembers?.[0]?.displayName || ladder.teamMembers?.[0]?.name || 'Unknown'}
                      {ladder.localizedDivisionName && (
                        <span> • Division: {ladder.localizedDivisionName}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No ladder data found. Play some ranked games to see your ladder standings!
                </div>
              </CardContent>
            </Card>
          )}

          {ladderData.placementMatches && ladderData.placementMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Placement Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  You have placement matches remaining in {ladderData.placementMatches.length} queue(s).
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}