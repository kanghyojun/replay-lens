'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, History, BarChart3 } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user, loading, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check if we just returned from OAuth
    if (user == null && searchParams.get('auth') === 'success') {
      refreshUser();
    }
  }, [user, searchParams, refreshUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to SC2 Match Tracker
        </h1>

        {loading ? (
          <div className="mt-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : user ? (
          <p className="text-xl text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{user.battletag}</span>!
          </p>
        ) : (
          <div className="mt-8">
            <p className="text-xl text-muted-foreground mb-8">
              Track your StarCraft II matches and improve your gameplay
            </p>
            <Button
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/battlenet`}
              size="lg"
            >
              Login with Battle.net to Get Started
            </Button>
          </div>
        )}
      </div>

      {user && (
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Link href="/matches">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <History className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Match History</CardTitle>
                    <CardDescription>View your recent games</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Check your match history, win/loss records, and recent game performance.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/ladder">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Trophy className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle>Ladder Summary</CardTitle>
                    <CardDescription>View your rankings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  See your current ladder standings, MMR, and league rankings across all game modes.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {!user && (
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <History className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Match Tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Keep track of all your StarCraft II matches with detailed statistics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Ladder Rankings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor your ladder progress and MMR across different game modes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle>Performance Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analyze your gameplay trends and improve your skills over time.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
