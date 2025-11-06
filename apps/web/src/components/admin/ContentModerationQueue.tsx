import { communityAPI } from '@/api/community-api'
import { liveStreamingAPI } from '@/api/live-streaming-api'
import { lostFoundAPI } from '@/api/lost-found-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { LostAlertStatus } from '@/core/domain/lost-found'
import type { Post } from '@/lib/community-types'
import type { LiveStream } from '@/lib/live-streaming-types'
import { createLogger } from '@/lib/logger'
import type { LostAlert } from '@/lib/lost-found-types'
import { userService } from '@/lib/user-service'
import {
  ChatCircle,
  CheckCircle,
  Clock,
  MapPin,
  VideoCamera,
  XCircle
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { Presence, motion } from '@petspark/motion'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

const logger = createLogger('ContentModerationQueue')

type ContentType = 'lost-found' | 'community' | 'live-stream'
type ModerationStatus = 'pending' | 'approved' | 'rejected'

interface ModerationItem {
  id: string
  type: ContentType
  status: ModerationStatus
  content: LostAlert | Post | LiveStream
  reportedBy?: string
  reportedAt?: string
  reason?: string
}

export function ContentModerationQueue() {
  const [selectedType, setSelectedType] = useState<ContentType>('community')
  const [selectedStatus, setSelectedStatus] = useState<ModerationStatus>('pending')
  const [items, setItems] = useState<ModerationItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [decisionReason, setDecisionReason] = useState<string>('')
  const [decisionText, setDecisionText] = useState('')

  useEffect(() => {
    loadQueue()
  }, [selectedType, selectedStatus])

  const loadQueue = async () => {
    try {
      setLoading(true)
      const newItems: ModerationItem[] = []

      if (selectedType === 'lost-found') {
        const queryParams: { limit: number; status?: LostAlertStatus[] } = { limit: 50 }
        if (selectedStatus === 'pending') {
          queryParams.status = ['active']
        }
        const result = await lostFoundAPI.queryAlerts(
          queryParams.status !== undefined
            ? { limit: queryParams.limit, status: queryParams.status }
            : { limit: queryParams.limit }
        )
        
        result.alerts.forEach(alert => {
          // Check if alert needs moderation (e.g., has been reported)
          if (selectedStatus === 'pending' || alert.status === 'active') {
            newItems.push({
              id: alert.id,
              type: 'lost-found',
              status: 'pending',
              content: alert
            })
          }
        })
      } else if (selectedType === 'community') {
        const pendingPosts = await communityAPI.getPendingPosts()
        
        pendingPosts.forEach(post => {
          newItems.push({
            id: post.id,
            type: 'community',
            status: post.status === 'pending_review' ? 'pending' : post.status === 'active' ? 'approved' : 'rejected',
            content: post
          })
        })

        // Also get reported posts - fetch all posts to find reported ones
        const allPosts = await communityAPI.getAllPosts()
        const reports = await communityAPI.getReportsForModeration({
          status: ['pending'],
          entityType: ['pet', 'message'], // Check all possible entity types (posts map to 'pet')
          limit: 50
        })
        
        // Add reported posts to moderation queue
        for (const report of reports) {
          // Find the post that matches the reported entity ID
          const reportedPost = allPosts.find((p: Post) => p.id === report.reportedEntityId)
          if (reportedPost) {
            const existingItem = newItems.find(item => item.id === reportedPost.id)
            if (!existingItem) {
              newItems.push({
                id: reportedPost.id,
                type: 'community',
                status: reportedPost.status === 'pending_review' ? 'pending' : reportedPost.status === 'active' ? 'approved' : 'rejected',
                content: reportedPost,
                reportedBy: report.reporterId,
                reportedAt: report.createdAt,
                reason: report.reason
              })
            } else {
              // Update existing item with report info if not already reported
              if (!existingItem.reportedBy) {
                existingItem.reportedBy = report.reporterId
                existingItem.reportedAt = report.createdAt
                existingItem.reason = report.reason
              }
            }
          }
        }
      } else if (selectedType === 'live-stream') {
        const allStreams = await liveStreamingAPI.getAllStreams()
        
        allStreams.forEach(stream => {
          // Streams that are live or recently ended might need moderation
          if (stream.status === 'live' || (stream.status === 'ended' && stream.endedAt && 
              new Date(stream.endedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000)) {
            newItems.push({
              id: stream.id,
              type: 'live-stream',
              status: 'pending',
              content: stream
            })
          }
        })
      }

      // Filter by status
      const filtered = newItems.filter(item => {
        if (selectedStatus === 'pending') return item.status === 'pending'
        if (selectedStatus === 'approved') return item.status === 'approved'
        return item.status === 'rejected'
      })

      setItems(filtered)
    } catch (error) {
      logger.error('Failed to load moderation queue', error instanceof Error ? error : new Error(String(error)))
      toast.error('Failed to load moderation queue')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedItem) return

    try {
      setLoading(true)
      const user = await userService.user()
      if (!user) {
        throw new Error('Moderator context unavailable')
      }

      if (selectedItem.type === 'community') {
        const post = selectedItem.content as Post
        await communityAPI.updatePostStatus(post.id, 'active', user.id, 'Approved by moderator')
        logger.info('Content approved', {
          type: 'community',
          contentId: post.id,
          moderatorId: user.id,
          action: 'approve'
        })
      } else if (selectedItem.type === 'lost-found') {
        // Lost & Found alerts are auto-approved, but we can mark as reviewed
        const alert = selectedItem.content as LostAlert
        // Note: Lost & Found alerts don't have a "reviewed" status
        // They are auto-approved and can be archived if needed
        logger.info('Lost & Found alert reviewed', {
          alertId: alert.id,
          reviewerId: user.id,
          status: 'approved'
        })
      } else if (selectedItem.type === 'live-stream') {
        // Live streams are auto-approved
        // NOTE: Review status tracking should be added for live streams
      }

      toast.success('Content approved')
      await loadQueue()
      setSelectedItem(null)
      setDecisionText('')
    } catch (error) {
      logger.error('Failed to approve content', error instanceof Error ? error : new Error(String(error)))
      toast.error('Failed to approve content')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedItem || !decisionText) return

    try {
      setLoading(true)
      const user = await userService.user()
      if (!user) {
        throw new Error('Moderator context unavailable')
      }

      if (selectedItem.type === 'community') {
        const post = selectedItem.content as Post
        await communityAPI.updatePostStatus(post.id, 'rejected', user.id, decisionText)
        logger.info('Content rejected', {
          type: 'community',
          contentId: post.id,
          moderatorId: user.id,
          action: 'reject',
          reason: decisionReason,
          details: decisionText
        })
      } else if (selectedItem.type === 'lost-found') {
        const alert = selectedItem.content as LostAlert
        await lostFoundAPI.updateAlertStatus(alert.id, 'archived', user.id)
      } else if (selectedItem.type === 'live-stream') {
        // For live streams, we can't really reject them while they're live
        // But we can note this for review
        toast.info('Live stream rejection noted for review')
      }

      toast.success('Content rejected')
      await loadQueue()
      setSelectedItem(null)
      setDecisionText('')
      setDecisionReason('')
    } catch (error) {
      logger.error('Failed to reject content', error instanceof Error ? error : new Error(String(error)))
      toast.error('Failed to reject content')
    } finally {
      setLoading(false)
    }
  }

  const getContentTypeLabel = (type: ContentType): string => {
    switch (type) {
      case 'lost-found': return 'Lost & Found'
      case 'community': return 'Community Post'
      case 'live-stream': return 'Live Stream'
    }
  }

  const renderContentPreview = (item: ModerationItem): React.ReactElement | null => {
    if (item.type === 'lost-found') {
      const alert = item.content as LostAlert
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getContentTypeLabel(item.type)}</Badge>
            <Badge variant={alert.status === 'active' ? 'destructive' : 'default'}>
              {alert.status}
            </Badge>
          </div>
          <h4 className="font-semibold">{alert.petSummary.name}</h4>
          <p className="text-sm text-muted-foreground">
            {alert.petSummary.species} • {alert.petSummary.breed || 'Unknown breed'}
          </p>
          <p className="text-xs text-muted-foreground">
            Last seen: {formatDistanceToNow(new Date(alert.lastSeen.whenISO), { addSuffix: true })}
          </p>
          {alert.photos && alert.photos.length > 0 && (
            <div className="w-24 h-24 bg-muted rounded overflow-hidden">
              <img src={alert.photos[0]} alt={alert.petSummary.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )
    } else if (item.type === 'community') {
      const post = item.content as Post
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getContentTypeLabel(item.type)}</Badge>
            <Badge variant={post.status === 'active' ? 'default' : post.status === 'pending_review' ? 'secondary' : 'destructive'}>
              {post.status}
            </Badge>
          </div>
          <h4 className="font-semibold">Post by {post.authorName}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.text || 'No text content'}
          </p>
          {post.media && post.media.length > 0 && post.media[0] && (
            <div className="w-24 h-24 bg-muted rounded overflow-hidden">
              {(() => {
                const mediaItem = post.media?.[0]
                if (!mediaItem) return null
                const mediaUrl = typeof mediaItem === 'string' ? mediaItem : ('url' in mediaItem ? mediaItem.url : '')
                return <img src={mediaUrl} alt="Post media" className="w-full h-full object-cover" />
              })()}
            </div>
          )}
        </div>
      )
    } else if (item.type === 'live-stream') {
      const stream = item.content as LiveStream
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getContentTypeLabel(item.type)}</Badge>
            <Badge variant={stream.status === 'live' ? 'destructive' : 'default'}>
              {stream.status}
            </Badge>
          </div>
          <h4 className="font-semibold">{stream.title}</h4>
          <p className="text-sm text-muted-foreground">
            Host: {stream.hostName} • {stream.viewerCount} viewers
          </p>
          <p className="text-xs text-muted-foreground">
            Category: {stream.category}
          </p>
        </div>
      )
    }
    return null
  }

  const filteredItems = items.filter(item => item.type === selectedType)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Moderation Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and moderate Lost & Found alerts, Community posts, and Live streams
          </p>
        </div>
        <Button onClick={loadQueue} variant="outline">
          <Clock size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ContentType)} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="community">
            <ChatCircle size={16} className="mr-2" />
            Community ({items.filter(i => i.type === 'community').length})
          </TabsTrigger>
          <TabsTrigger value="lost-found">
            <MapPin size={16} className="mr-2" />
            Lost & Found ({items.filter(i => i.type === 'lost-found').length})
          </TabsTrigger>
          <TabsTrigger value="live-stream">
            <VideoCamera size={16} className="mr-2" />
            Live Streams ({items.filter(i => i.type === 'live-stream').length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="flex gap-4 mb-4">
            <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ModerationStatus)}>
              <TabsList>
                <TabsTrigger value="pending">
                  Pending ({filteredItems.filter(i => i.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({filteredItems.filter(i => i.status === 'approved').length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({filteredItems.filter(i => i.status === 'rejected').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              <Presence mode="popLayout">
                {loading && filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <MotionView
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <CheckCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items in this queue</p>
                  </MotionView>
                ) : (
                  filteredItems.map((item) => (
                    <MotionView
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex gap-4">
                          <div className="flex-1">
                            {renderContentPreview(item)}
                          </div>
                          <div className="flex items-center">
                            <Badge variant={
                              item.status === 'pending' ? 'secondary' :
                              item.status === 'approved' ? 'default' : 'destructive'
                            }>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </MotionView>
                  ))
                )}
              </Presence>
            </div>
          </ScrollArea>
        </div>
      </Tabs>

      <Dialog open={selectedItem !== null} onOpenChange={() => {
        setSelectedItem(null)
        setDecisionText('')
        setDecisionReason('')
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Review</DialogTitle>
            <DialogDescription>
              Review {selectedItem && getContentTypeLabel(selectedItem.type)} content
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              <div className="space-y-4">
                {renderContentPreview(selectedItem)}
              </div>

              {selectedItem.status === 'pending' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                    <Select value={decisionReason} onValueChange={setDecisionReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="misinformation">Misinformation</SelectItem>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="violence">Violence</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <Textarea
                      value={decisionText}
                      onChange={(e) => setDecisionText(e.target.value)}
                      placeholder="Add any additional context..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle size={16} className="mr-2" />
                      Approve
                    </Button>
                    <Button onClick={handleReject} disabled={loading || !decisionText} variant="destructive">
                      <XCircle size={16} className="mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

