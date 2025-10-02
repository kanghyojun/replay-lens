'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, Trophy, Clock, Map } from 'lucide-react';

interface ReplayData {
  id: number;
  filename: string;
  fileSize: number;
  matchDate: string | null;
  mapName: string | null;
  gameLength: number | null;
  gameType: string | null;
  winner: string | null;
  uploadedAt: string;
  players: Array<{
    name: string;
    race: string;
    teamId: number;
    color: any;
    result: string;
  }> | null;
  replayHeader: any;
  replayDetails: any;
}

export default function ReplayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReplay() {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:2001/api/replays/${resolvedParams.id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch replay');
        }

        const data = await response.json();
        if (data.success) {
          setReplayData(data.replay);
        } else {
          setError(data.error || 'Failed to load replay');
        }
      } catch (err) {
        console.error('Error fetching replay:', err);
        setError('Failed to load replay data');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchReplay();
    }
  }, [resolvedParams.id, user]);

  if (authLoading || loading) {
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
          <h1 className="text-3xl font-bold mb-4">Replay Analysis</h1>
          <p className="text-muted-foreground mb-8">
            Please login to view replay analysis
          </p>
          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (error || (!loading && !replayData)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Replay Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || 'The requested replay could not be found'}
          </p>
          <Button onClick={() => router.push('/replays')}>
            Back to Replays
          </Button>
        </div>
      </div>
    );
  }

  // Format duration from game loops
  const formatDuration = (gameLength: number | null) => {
    if (!gameLength) return 'Unknown';
    const seconds = Math.floor(gameLength / 22.4); // SC2 runs at ~22.4 game loops per second
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(parseInt(dateString) * 1000);
    return date.toLocaleString();
  };

  // Get race color
  const getRaceColor = (race: string) => {
    switch (race?.toLowerCase()) {
      case 'terr': return 'bg-blue-500';
      case 'prot': return 'bg-yellow-500';
      case 'zerg': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Get result text from result code
  const getResultText = (result: string | number) => {
    if (typeof result === 'number') {
      return result === 1 ? 'Win' : result === 2 ? 'Loss' : 'Unknown';
    }
    return result || 'Unknown';
  };

  // Check if result is win
  const isWin = (result: string | number) => {
    if (typeof result === 'number') {
      return result === 1;
    }
    return result?.toLowerCase() === 'win';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{replayData?.filename || 'Replay Analysis'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Uploaded: {replayData ? new Date(replayData.uploadedAt).toLocaleString() : 'Unknown'}
            </p>
          </div>
          <Button onClick={() => router.push('/replays')} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Replays
          </Button>
        </div>

        {/* Game Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Game Overview</CardTitle>
            <CardDescription>Basic information about the match</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Map className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Map</p>
                  <p className="font-medium">{replayData?.mapName || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(replayData?.gameLength || null)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Game Type</p>
                  <p className="font-medium">{replayData?.gameType || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Winner</p>
                  <p className="font-medium">{replayData?.winner || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players */}
        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
            <CardDescription>Players in this match</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {replayData?.players && replayData.players.length > 0 ? (
                replayData.players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getRaceColor(player.race)}`} />
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {player.race} • Team {player.teamId}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isWin(player.result) ? "default" : "destructive"}>
                      {getResultText(player.result)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No player data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Sections (Mock) */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Economy Analysis</CardTitle>
              <CardDescription>Resource collection and spending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Coming soon...
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Army Composition</CardTitle>
              <CardDescription>Units built during the game</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Coming soon...
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Key events throughout the match</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Coming soon...
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>APM, resources, and more</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Coming soon...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
