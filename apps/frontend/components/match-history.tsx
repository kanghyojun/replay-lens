'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Target, Clock } from 'lucide-react';

interface SC2Match {
  map: string;
  type: string;
  decision: string;
  speed: string;
  date: number;
  dateFormatted: string;
  isWin: boolean;
  isLoss: boolean;
}

interface MatchData {
  matches: SC2Match[];
  profile: {
    name: string;
    regionName: string;
  };
  totalMatches: number;
  wins: number;
  losses: number;
}

export function MatchHistory() {
  const { user } = useAuth();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/sc2/matches', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();

      if (data.success) {
        setMatchData(data);
      } else {
        throw new Error(data.error || 'Failed to fetch matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const winRate = matchData ? Math.round((matchData.wins / matchData.totalMatches) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{matchData?.totalMatches || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground">Total Matches</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-green-500" />
              <div className="text-2xl font-bold text-green-500">{matchData?.wins || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{winRate}%</div>
            </div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Match History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Matches</CardTitle>
          <Button onClick={fetchMatches} disabled={loading} size="sm">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-destructive text-sm mb-4">
              Error: {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            </div>
          )}

          {matchData && matchData.matches.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Result</TableHead>
                  <TableHead>Map</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchData.matches.slice(0, 10).map((match, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge
                        variant={match.isWin ? "default" : match.isLoss ? "destructive" : "secondary"}
                        className={match.isWin ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {match.decision}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{match.map}</TableCell>
                    <TableCell>{match.type}</TableCell>
                    <TableCell>{match.speed}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {match.dateFormatted}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {matchData && matchData.matches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No matches found. Play some games to see your match history!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}