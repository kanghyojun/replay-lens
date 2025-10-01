'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, Trophy, Clock, Map } from 'lucide-react';

interface ReplayData {
  filename: string;
  fileSize: number;
  matchDate: number;
  mapName: string;
  duration: number;
  gameLength: number;
  winner: string;
  players: Array<{
    name: string;
    race: string;
    teamId: number;
    color: any;
    result: string;
  }>;
}

export default function ReplayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch replay data from API
    // For now, show mock data
    setLoading(false);
  }, [resolvedParams.id]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Replay Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Replay ID: {resolvedParams.id}
            </p>
          </div>
          <Button onClick={() => router.push('/replays')} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Replays
          </Button>
        </div>

        {/* Mock Data Notice */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              <strong>Mock View:</strong> This is a placeholder page. Actual replay analysis will be implemented later.
            </p>
          </CardContent>
        </Card>

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
                  <p className="font-medium">[Map Name]</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">[Duration]</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Game Type</p>
                  <p className="font-medium">1v1</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Winner</p>
                  <p className="font-medium">[Winner Name]</p>
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
              {[1, 2].map((player) => (
                <div key={player} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">Player {player}</p>
                      <p className="text-sm text-muted-foreground">Terran</p>
                    </div>
                  </div>
                  <Badge variant={player === 1 ? "default" : "destructive"}>
                    {player === 1 ? "Victory" : "Defeat"}
                  </Badge>
                </div>
              ))}
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
