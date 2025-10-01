'use client';

import { useAuth } from '@/components/auth-provider';
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
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const MATCHES_PER_PAGE = 20;

export default function MatchHistoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
        // Sort matches by date descending (newest first)
        data.matches.sort((a: SC2Match, b: SC2Match) => b.date - a.date);
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

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Match Histories</h1>
          <p className="text-muted-foreground mb-8">
            Please login to view your match histories
          </p>
          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Pagination logic
  const totalPages = matchData ? Math.ceil(matchData.matches.length / MATCHES_PER_PAGE) : 0;
  const startIndex = (currentPage - 1) * MATCHES_PER_PAGE;
  const endIndex = startIndex + MATCHES_PER_PAGE;
  const currentMatches = matchData?.matches.slice(startIndex, endIndex) || [];

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Match Histories</h1>
            {matchData?.season && (
              <p className="text-sm text-muted-foreground mt-1">
                Season {matchData.season.number} {matchData.season.year}: {matchData.wins}W-{matchData.losses}L ({matchData.winRate}% win rate)
              </p>
            )}
          </div>
          <Button onClick={() => router.push('/matches')} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Summary
          </Button>
        </div>

        {/* Match History Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Matches</CardTitle>
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

            {!loading && matchData && matchData.matches.length > 0 && (
              <>
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
                    {currentMatches.map((match, index) => (
                      <TableRow key={`${match.date}-${index}`}>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, matchData.matches.length)} of {matchData.matches.length} matches
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!loading && matchData && matchData.matches.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No matches found. Play some games to see your match history!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
