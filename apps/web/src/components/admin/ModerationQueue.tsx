import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { moderationService, photoService } from '@/lib/backend-services';
import type { ModerationReason, ModerationTask, PhotoRecord } from '@/lib/backend-types';
import { createLogger } from '@/lib/logger';
import {
  CheckCircle,
  Clock,
  Eye,
  Image as ImageIcon,
  ShieldCheck,
  Warning,
  XCircle,
  User,
  Dog,
  Calendar,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('ModerationQueue');

export function ModerationQueue() {
  const [tasks, setTasks] = useState<ModerationTask[]>([]);
  const [photos, setPhotos] = useState<Map<string, PhotoRecord>>(new Map());
  const [selectedTab, setSelectedTab] = useState<'pending' | 'in_progress' | 'completed'>(
    'pending'
  );
  const [selectedTask, setSelectedTask] = useState<ModerationTask | null>(null);
  const [detailPhoto, setDetailPhoto] = useState<PhotoRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [decisionReason, setDecisionReason] = useState<ModerationReason>('other');
  const [decisionText, setDecisionText] = useState('');

  const loadQueue = useCallback(async () => {
    try {
      const queue = await moderationService.getQueue();
      const allTasks = [...queue.pending, ...queue.inProgress, ...queue.completed];
      setTasks(allTasks);

      const photoMap = new Map<string, PhotoRecord>();
      for (const task of allTasks) {
        try {
          const allPhotos = await photoService.getPhotosByOwner(task.ownerId, true);
          const photo = allPhotos.find((p) => p.id === task.photoId);
          if (photo) photoMap.set(photo.id, photo);
        } catch (error) {
          logger.error(
            'Failed to load photos for task',
            error instanceof Error ? error : new Error(String(error)),
            { taskId: task.id, ownerId: task.ownerId }
          );
        }
      }
      setPhotos(photoMap);
    } catch (error) {
      logger.error(
        'Failed to load moderation queue',
        error instanceof Error ? error : new Error(String(error))
      );
      void toast.error('Failed to load moderation queue');
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const filteredTasks = tasks.filter((t) => {
    if (selectedTab === 'pending') return t.status === 'pending';
    if (selectedTab === 'in_progress') return t.status === 'in_progress';
    return t.status === 'completed';
  });

  const handleTaskClick = useCallback(
    (task: ModerationTask) => {
      setSelectedTask(task);
      const photo = photos.get(task.photoId);
      setDetailPhoto(photo ?? null);
    },
    [photos]
  );

  const handleTakeTask = useCallback(async () => {
    if (!selectedTask) return;

    setLoading(true);
    try {
      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();
      if (!user) throw new Error('Not authenticated');
      await moderationService.takeTask(selectedTask.id, user.id);
      void toast.success('Task assigned to you');
      await loadQueue();
      setSelectedTask(null);
      setDetailPhoto(null);
    } catch {
      void toast.error('Failed to take task');
    } finally {
      setLoading(false);
    }
  }, [selectedTask, loadQueue]);

  const handleApprove = useCallback(async () => {
    if (!selectedTask) return;

    setLoading(true);
    try {
      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();
      if (!user) throw new Error('Not authenticated');
      const moderatorName = typeof user.name === 'string' ? user.name : 'Moderator';
      await moderationService.makeDecision(
        selectedTask.id,
        'approve',
        undefined,
        'Photo meets all quality and safety standards',
        user.id,
        moderatorName
      );
      void toast.success('Photo approved!');
      await loadQueue();
      setSelectedTask(null);
      setDetailPhoto(null);
      setDecisionText('');
    } catch {
      void toast.error('Failed to approve photo');
    } finally {
      setLoading(false);
    }
  }, [selectedTask, loadQueue]);

  const handleReject = useCallback(async () => {
    if (!selectedTask || !decisionText) return;

    setLoading(true);
    try {
      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();
      if (!user) throw new Error('Not authenticated');
      const moderatorName = typeof user.name === 'string' ? user.name : 'Moderator';
      await moderationService.makeDecision(
        selectedTask.id,
        'reject',
        decisionReason,
        decisionText,
        user.id,
        moderatorName
      );
      void toast.success('Photo rejected');
      await loadQueue();
      setSelectedTask(null);
      setDetailPhoto(null);
      setDecisionText('');
      setDecisionReason('other');
    } catch {
      void toast.error('Failed to reject photo');
    } finally {
      setLoading(false);
    }
  }, [selectedTask, decisionText, decisionReason, loadQueue]);

  const handleHoldForKYC = useCallback(async () => {
    if (!selectedTask) return;

    setLoading(true);
    try {
      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();
      if (!user) throw new Error('Not authenticated');
      const moderatorName = typeof user.name === 'string' ? user.name : 'Moderator';
      await moderationService.makeDecision(
        selectedTask.id,
        'hold_for_kyc',
        undefined,
        'Content requires KYC verification before publishing',
        user.id,
        moderatorName
      );
      void toast.success('Photo held for KYC');
      await loadQueue();
      setSelectedTask(null);
      setDetailPhoto(null);
      setDecisionText('');
    } catch {
      void toast.error('Failed to hold photo');
    } finally {
      setLoading(false);
    }
  }, [selectedTask, loadQueue]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-500/10';
      case 'medium':
        return 'text-orange-500 bg-orange-500/10';
      case 'low':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <Warning size={16} weight="fill" />;
    return <Clock size={16} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Photo Moderation Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve pet photos before they go live
          </p>
        </div>
        <Button
          onClick={() => {
            void loadQueue().catch((error) => {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to load queue from button', err);
            });
          }}
          variant="outline"
        >
          <Clock size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({tasks.filter((t) => t.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({tasks.filter((t) => t.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <ScrollArea className="h-150">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tasks in this queue</p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const photo = photos.get(task.photoId);
                  return (
                    <div
                      key={task.id}
                      className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                      <Card
                        className="p-4 cursor-pointer transition-colors hover:bg-accent/50"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                            {photo?.originalUrl ? (
                              <img
                                src={photo.originalUrl}
                                alt="Pet photo"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={32} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={getPriorityColor(task.priority)}>
                                  {getPriorityIcon(task.priority)}
                                  <span className="ml-1">{task.priority}</span>
                                </Badge>
                                {photo?.safetyCheck?.flags?.map((flag) => (
                                  <Badge key={flag} variant="outline" className="text-xs">
                                    {flag.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                              <Badge
                                variant={
                                  task.status === 'pending'
                                    ? 'secondary'
                                    : task.status === 'in_progress'
                                      ? 'default'
                                      : 'outline'
                                }
                              >
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User size={14} />
                                <span>
                                  Owner ID:{' '}
                                  {typeof task.ownerId === 'string'
                                    ? task.ownerId.substring(0, 12)
                                    : 'N/A'}
                                  ...
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Dog size={14} />
                                <span>
                                  Pet ID:{' '}
                                  {typeof task.petId === 'string'
                                    ? task.petId.substring(0, 12)
                                    : 'N/A'}
                                  ...
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar size={14} />
                                <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                              </div>
                              {photo?.safetyCheck && (
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span
                                    className={
                                      photo.safetyCheck.isNSFW ? 'text-red-500' : 'text-green-500'
                                    }
                                  >
                                    NSFW: {photo.safetyCheck.isNSFW ? 'Yes' : 'No'}
                                  </span>
                                  <span
                                    className={
                                      photo.safetyCheck.hasHumanFaces
                                        ? 'text-orange-500'
                                        : 'text-green-500'
                                    }
                                  >
                                    Human Faces: {photo.safetyCheck.humanFaceCount}
                                  </span>
                                  <span>
                                    Animal: {(photo.safetyCheck.confidence.animal * 100).toFixed(0)}
                                    %
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog
        open={selectedTask !== null}
        onOpenChange={() => {
          setSelectedTask(null);
          setDetailPhoto(null);
          setDecisionText('');
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Photo Review</DialogTitle>
          </DialogHeader>

          {detailPhoto?.safetyCheck && (
            <div className="space-y-6">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={detailPhoto?.originalUrl ?? ''}
                  alt="Photo for review"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Safety Check Results</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>NSFW Content:</span>
                      <Badge variant={detailPhoto.safetyCheck.isNSFW ? 'destructive' : 'outline'}>
                        {detailPhoto.safetyCheck.isNSFW ? 'Detected' : 'Clean'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Violent Content:</span>
                      <Badge
                        variant={detailPhoto.safetyCheck.isViolent ? 'destructive' : 'outline'}
                      >
                        {detailPhoto.safetyCheck.isViolent ? 'Detected' : 'Clean'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Human Faces:</span>
                      <span>
                        {detailPhoto.safetyCheck.humanFaceCount} (
                        {(detailPhoto.safetyCheck.humanFaceDominance * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duplicate:</span>
                      <Badge
                        variant={detailPhoto.safetyCheck.isDuplicate ? 'destructive' : 'outline'}
                      >
                        {detailPhoto.safetyCheck.isDuplicate ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Confidence Scores</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Animal:</span>
                      <span className="font-medium">
                        {(detailPhoto.safetyCheck.confidence.animal * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>NSFW Risk:</span>
                      <span className="font-medium">
                        {(detailPhoto.safetyCheck.confidence.nsfw * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Violence Risk:</span>
                      <span className="font-medium">
                        {(detailPhoto.safetyCheck.confidence.violence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Human Face:</span>
                      <span className="font-medium">
                        {(detailPhoto.safetyCheck.confidence.humanFace * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {detailPhoto.safetyCheck.breedInference && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Breed Detection</h3>
                  <p className="text-sm">
                    <span className="font-medium">
                      {detailPhoto.safetyCheck.breedInference.breed}
                    </span>{' '}
                    (Confidence:{' '}
                    {(detailPhoto.safetyCheck.breedInference.confidence * 100).toFixed(0)}%)
                  </p>
                </Card>
              )}

              {detailPhoto.safetyCheck.flags && detailPhoto.safetyCheck.flags.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Flags</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailPhoto.safetyCheck.flags.map((flag) => (
                      <Badge key={flag} variant="outline">
                        <Warning size={12} className="mr-1" />
                        {flag.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {selectedTask?.status === 'pending' && (
                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      void handleTakeTask().catch((error) => {
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger.error('Failed to take task from button', err);
                      });
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    <Eye size={16} className="mr-2" />
                    Take This Task
                  </Button>
                </div>
              )}

              {selectedTask?.status === 'in_progress' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                    <Select
                      value={decisionReason}
                      onValueChange={(v) => setDecisionReason(v as ModerationReason)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                        <SelectItem value="not_animal">Not an Animal</SelectItem>
                        <SelectItem value="human_faces">Too Many Human Faces</SelectItem>
                        <SelectItem value="low_quality">Low Quality</SelectItem>
                        <SelectItem value="duplicate">Duplicate</SelectItem>
                        <SelectItem value="nsfw">NSFW Content</SelectItem>
                        <SelectItem value="policy_violation">Policy Violation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <Textarea
                      value={decisionText}
                      onChange={(e) => { setDecisionText(e.target.value); }}
                      placeholder="Add any additional context..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => {
                        void handleApprove().catch((error) => {
                          const err = error instanceof Error ? error : new Error(String(error));
                          logger.error('Failed to approve from button', err);
                        });
                      }}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        void handleReject().catch((error) => {
                          const err = error instanceof Error ? error : new Error(String(error));
                          logger.error('Failed to reject from button', err);
                        });
                      }}
                      disabled={loading || !decisionText}
                      variant="destructive"
                    >
                      <XCircle size={16} className="mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        void handleHoldForKYC().catch((error) => {
                          const err = error instanceof Error ? error : new Error(String(error));
                          logger.error('Failed to hold for KYC from button', err);
                        });
                      }}
                      disabled={loading}
                      variant="outline"
                    >
                      <ShieldCheck size={16} className="mr-2" />
                      Hold for KYC
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
