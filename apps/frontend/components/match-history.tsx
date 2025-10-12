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
  season: {
    seasonId: number;
    number: number;
    year: number;
    startDate: number;
  };
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: string;
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sc2/matches`, {
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

  return (
    <div className="space-y-6">
      {/* Season Stats */}
      {matchData?.season && (
        <div className="text-sm text-muted-foreground">
          Season {matchData.season.number} {matchData.season.year}: {matchData.wins}W-{matchData.losses}L ({matchData.winRate}% win rate)
        </div>
      )}

      {/* Match History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent 25 Matches</CardTitle>
          <Button onClick={fetchMatches} disabled={loading} size="sm" variant="outline">
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
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchData.matches.map((match, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={match.isWin ? "text-green-600 border-green-300" : match.isLoss ? "text-red-600 border-red-300" : ""}
                      >
                        {match.decision}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{match.map}</TableCell>
                    <TableCell>{match.type}</TableCell>
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