'use client';

import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { FileVideo, ChevronLeft, ChevronRight } from 'lucide-react';
import { decodeSC2Name } from '@/lib/utils';

interface Replay {
  id: number;
  filename: string;
  uploadedAt: string;
  matchDate: string | null;
  mapName: string | null;
  gameType: string | null;
  winner: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AllReplaysPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loadingReplays, setLoadingReplays] = useState(false);

  const fetchReplays = useCallback(async (page: number) => {
    if (!user) return;

    setLoadingReplays(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/replays?page=${page}&limit=50`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReplays(data.replays);
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch replays:', err);
    } finally {
      setLoadingReplays(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReplays(1);
  }, [fetchReplays]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReplays(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
          <h1 className="text-3xl font-bold mb-4">All Replays</h1>
          <p className="text-muted-foreground mb-8">
            Please login to view your replays
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Replays</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pagination.total} replay{pagination.total !== 1 ? 's' : ''} total
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/replays')}
          >
            Back to Upload
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Replays</CardTitle>
            <CardDescription>
              Browse all your uploaded replay files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReplays ? (
              <div className="flex justify-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              </div>
            ) : replays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No replays found. Upload your first replay to get started!
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {replays.map((replay) => (
                    <div
                      key={replay.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(`/replays/${replay.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <FileVideo className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{decodeSC2Name(replay.filename)}</p>
                          <p className="text-sm text-muted-foreground">
                            {decodeSC2Name(replay.mapName) || 'Unknown Map'} • {replay.gameType || 'Unknown'}
                            {replay.winner && ` • Winner: ${decodeSC2Name(replay.winner)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(replay.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1 || loadingReplays}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages || loadingReplays}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
