'use client';

import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { Upload, FileVideo, X } from 'lucide-react';

interface Replay {
  id: number;
  filename: string;
  uploadedAt: string;
  matchDate: string | null;
  mapName: string | null;
  gameType: string | null;
  winner: string | null;
}

export default function ReplaysPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loadingReplays, setLoadingReplays] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const replayFiles = files.filter(file => file.name.endsWith('.SC2Replay'));

    if (replayFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...replayFiles]);
      setError(null);
    } else {
      setError('Please upload valid .SC2Replay files');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const replayFiles = files.filter(file => file.name.endsWith('.SC2Replay'));

    if (replayFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...replayFiles]);
      setError(null);
    } else {
      setError('Please upload valid .SC2Replay files');
    }
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    const uploadedIds: number[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress({ current: i + 1, total: selectedFiles.length });

        const formData = new FormData();
        formData.append('replay', file);

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/replays/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(`Failed to upload ${file.name}: ${data.error || 'Unknown error'}`);
        }

        const data = await response.json();
        uploadedIds.push(data.replayId);
      }

      // Clear selected files and refresh replay list
      setSelectedFiles([]);
      await fetchReplays();

      // Redirect to the first uploaded replay
      if (uploadedIds.length > 0) {
        router.push(`/replays/${uploadedIds[0]}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload replays');
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]);
    setError(null);
  };

  const fetchReplays = useCallback(async () => {
    if (!user) return;

    setLoadingReplays(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/replays`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReplays(data.replays);
        }
      }
    } catch (err) {
      console.error('Failed to fetch replays:', err);
    } finally {
      setLoadingReplays(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReplays();
  }, [fetchReplays]);

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
          <h1 className="text-3xl font-bold mb-4">Replay Analysis</h1>
          <p className="text-muted-foreground mb-8">
            Please login to upload and analyze replays
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
        <div>
          <h1 className="text-3xl font-bold">Replay Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your StarCraft II replay files for detailed analysis
          </p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Replay</CardTitle>
            <CardDescription>
              Drag and drop your .SC2Replay file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFiles.length === 0 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent'
                }`}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Drop your replay files here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported format: .SC2Replay (multiple files supported)
                </p>
                <input
                  id="fileInput"
                  type="file"
                  accept=".SC2Replay"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAllFiles}
                    disabled={uploading}
                  >
                    Clear All
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileVideo className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="text-destructive text-sm">
                    {error}
                  </div>
                )}

                {uploading && uploadProgress.total > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Uploading {uploadProgress.current} of {uploadProgress.total}...
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading
                      ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                      : `Upload and Analyze ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
                    }
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRemoveAllFiles}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Replays */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Replays</CardTitle>
            <CardDescription>
              Your recently uploaded replay files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReplays ? (
              <div className="flex justify-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              </div>
            ) : replays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No replays uploaded yet. Upload your first replay to get started!
              </div>
            ) : (
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
                        <p className="font-medium">{replay.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {replay.mapName || 'Unknown Map'} • {replay.gameType || 'Unknown'}
                          {replay.winner && ` • Winner: ${replay.winner}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(replay.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
