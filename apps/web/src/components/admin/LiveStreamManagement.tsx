import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { VideoCamera, Eye, Heart, ChatCircle, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { streamingService } from '@/lib/streaming-service';
import { liveStreamingAPI } from '@/api/live-streaming-api';
import type { LiveStream } from '@/lib/streaming-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('LiveStreamManagement');

export function LiveStreamManagement() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  const loadStreams = useCallback(async () => {
    try {
      const apiStreams = await liveStreamingAPI.getAllStreams();
      // Convert API streams to service streams
      const convertedStreams = apiStreams.map((apiStream) => {
        // Map status: 'scheduled' | 'live' | 'ended' | 'cancelled' -> 'idle' | 'connecting' | 'live' | 'ending' | 'ended'
        let status: LiveStream['status'] = 'idle';
        if (apiStream.status === 'live') status = 'live';
        else if (apiStream.status === 'ended') status = 'ended';
        else if (apiStream.status === 'cancelled') status = 'ended';
        else if (apiStream.status === 'scheduled') status = 'connecting';

        return {
          id: apiStream.id,
          hostId: apiStream.hostId,
          hostName: apiStream.hostName,
          hostAvatar: apiStream.hostAvatar,
          title: apiStream.title,
          description: apiStream.description,
          category: apiStream.category as LiveStream['category'],
          status,
          allowChat: apiStream.allowChat,
          maxDuration: apiStream.maxDuration ?? 60,
          startedAt: apiStream.startedAt ?? apiStream.createdAt,
          endedAt: apiStream.endedAt,
          viewerCount: apiStream.viewerCount,
          peakViewerCount: apiStream.peakViewerCount,
          totalViews: apiStream.viewerCount,
          likesCount: apiStream.reactionsCount ?? 0,
          roomToken: apiStream.roomId,
          recordingUrl: apiStream.vodUrl,
          thumbnailUrl: apiStream.posterUrl ?? apiStream.thumbnail,
          tags: [],
        } as LiveStream;
      });
      setStreams(
        convertedStreams.sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )
      );
    } catch (error) {
      logger.error(
        'Failed to load streams',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error('Failed to load streams');
    }
  }, []);

  useEffect(() => {
    void loadStreams();
    const interval = setInterval(() => {
      void loadStreams();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadStreams]);

  const handleEndStream = useCallback(
    async (streamId: string) => {
      try {
        await streamingService.endStream(streamId);
        toast.success('Stream ended');
        await loadStreams();
        setSelectedStream(null);
      } catch (error) {
        logger.error(
          'Failed to end stream',
          error instanceof Error ? error : new Error(String(error))
        );
        toast.error('Failed to end stream');
      }
    },
    [loadStreams]
  );

  const getStatusColor = (status: LiveStream['status']) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 animate-pulse';
      case 'connecting':
        return 'bg-yellow-500';
      case 'ending':
        return 'bg-orange-500';
      case 'ended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const liveStreams = streams.filter((s) => s.status === 'live' || s.status === 'connecting');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Live Stream Management</h2>
        <p className="text-muted-foreground mt-1">
          Monitor active streams and review stream history
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{liveStreams.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Live Now</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{streams.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Streams</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {streams.reduce((sum, s) => sum + s.totalViews, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Total Views</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {Math.max(...streams.map((s) => s.peakViewerCount), 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Peak Viewers</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Streams ({streams.length})</CardTitle>
            <CardDescription>Click to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-150">
              <div className="space-y-3">
                {streams.map((stream) => (
                  <button
                    key={stream.id}
                    onClick={() => { setSelectedStream(stream); }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedStream?.id === stream.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={stream.hostAvatar} />
                        <AvatarFallback>{stream.hostName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(stream.status)}`}
                          />
                          <Badge variant="outline" className="text-xs">
                            {stream.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold line-clamp-1">{stream.title}</h4>
                        <p className="text-sm text-muted-foreground">{stream.hostName}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {stream.viewerCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={12} />
                            {stream.likesCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stream Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedStream ? (
              <div className="text-center py-24">
                <VideoCamera size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a stream to view details</p>
              </div>
            ) : (
              <ScrollArea className="h-150 pr-4">
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={selectedStream.hostAvatar} />
                        <AvatarFallback>{selectedStream.hostName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold">{selectedStream.title}</h3>
                        <p className="text-muted-foreground">{selectedStream.hostName}</p>
                      </div>
                    </div>
                    <Badge
                      variant={selectedStream.status === 'live' ? 'destructive' : 'secondary'}
                      className={selectedStream.status === 'live' ? 'animate-pulse' : ''}
                    >
                      {selectedStream.status.toUpperCase()}
                    </Badge>
                  </div>

                  {selectedStream.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{selectedStream.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium capitalize">
                        {selectedStream.category.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="font-medium">
                        {new Date(selectedStream.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedStream.endedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ended</p>
                      <p className="font-medium">
                        {new Date(selectedStream.endedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Eye size={18} className="text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{selectedStream.viewerCount}</div>
                        <div className="text-xs text-muted-foreground">Current Viewers</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Eye size={18} className="text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{selectedStream.peakViewerCount}</div>
                        <div className="text-xs text-muted-foreground">Peak Viewers</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Eye size={18} className="text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{selectedStream.totalViews}</div>
                        <div className="text-xs text-muted-foreground">Total Views</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Heart size={18} className="text-red-500" />
                        </div>
                        <div className="text-2xl font-bold">{selectedStream.likesCount}</div>
                        <div className="text-xs text-muted-foreground">Likes/Reactions</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <ChatCircle size={18} className="text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Chat: {selectedStream.allowChat ? 'Enabled' : 'Disabled'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedStream.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedStream.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Max Duration</p>
                    <p className="font-medium">
                      {Math.floor(selectedStream.maxDuration / 60)} minutes
                    </p>
                  </div>

                {(selectedStream.status === 'live' || selectedStream.status === 'connecting') && (
                  <div className="border-t pt-4">
                    <Button
                      onClick={() => {
                        void handleEndStream(selectedStream.id);
                      }}
                      variant="destructive"
                      className="w-full"
                    >
                        <X size={18} className="mr-2" />
                        Force End Stream
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
