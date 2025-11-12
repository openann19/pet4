'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useModalAnimation } from '@/effects/reanimated/use-modal-animation';
import { useStaggeredItem } from '@/effects/reanimated/use-staggered-item';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useStorage } from '@/hooks/use-storage';
import { createLogger } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  HealthRecord,
  PetHealthSummary,
  VaccinationRecord,
  VetReminder,
} from '@/lib/health-types';
import type { Pet } from '@/lib/types';
import {
  Bell,
  Calendar,
  CheckCircle,
  ClockCountdown,
  FileText,
  Heart,
  Plus,
  Syringe,
  Warning,
  X,
} from '@phosphor-icons/react';
import { differenceInDays, format, isPast } from 'date-fns';
import { toast } from 'sonner';

const logger = createLogger('PetHealthDashboard');

export interface PetHealthDashboardProps {
  pet: Pet;
  onClose: () => void;
}

interface VaccinationItemProps {
  vaccination: VaccinationRecord;
  index: number;
}

function VaccinationItem({ vaccination, index }: VaccinationItemProps): JSX.Element {
  const staggeredAnimation = useStaggeredItem({
    index,
    staggerDelay: 50,
  });

  return (
    <AnimatedView
      style={staggeredAnimation.itemStyle}
      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Syringe size={20} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold">{vaccination.name}</h4>
        <p className="text-sm text-muted-foreground">
          {format(new Date(vaccination.date), 'MMM dd, yyyy')} • {vaccination.veterinarian}
        </p>
        <p className="text-sm text-muted-foreground">{vaccination.clinic}</p>
        {vaccination.nextDueDate && (
          <Badge variant="outline" className="mt-2">
            Next: {format(new Date(vaccination.nextDueDate), 'MMM dd, yyyy')}
          </Badge>
        )}
      </div>
    </AnimatedView>
  );
}

interface HealthRecordItemProps {
  record: HealthRecord;
  index: number;
}

function HealthRecordItem({ record, index }: HealthRecordItemProps): JSX.Element {
  const staggeredAnimation = useStaggeredItem({
    index,
    staggerDelay: 50,
  });

  return (
    <AnimatedView
      style={staggeredAnimation.itemStyle}
      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold">{record.title}</h4>
        <Badge variant="outline">{record.type}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        {format(new Date(record.date), 'MMM dd, yyyy')}
        {record.veterinarian && ` • ${record.veterinarian}`}
      </p>
      <p className="text-sm">{record.description}</p>
      {record.diagnosis && (
        <p className="text-sm mt-2">
          <span className="font-medium">Diagnosis:</span> {record.diagnosis}
        </p>
      )}
    </AnimatedView>
  );
}

interface ReminderItemProps {
  reminder: VetReminder;
  index: number;
  onComplete: (reminderId: string) => void;
}

function ReminderItem({ reminder, index, onComplete }: ReminderItemProps): JSX.Element {
  const staggeredAnimation = useStaggeredItem({
    index,
    staggerDelay: 50,
  });

  const isOverdue = isPast(new Date(reminder.dueDate));
  const daysUntil = differenceInDays(new Date(reminder.dueDate), new Date());

  return (
    <AnimatedView
      style={staggeredAnimation.itemStyle}
      className={`flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow ${
        reminder.completed ? 'opacity-50' : ''
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          reminder.completed
            ? 'bg-green-100 dark:bg-green-900/20'
            : isOverdue
              ? 'bg-red-100 dark:bg-red-900/20'
              : 'bg-yellow-100 dark:bg-yellow-900/20'
        }`}
      >
        {reminder.completed ? (
          <CheckCircle size={20} className="text-green-600" weight="fill" />
        ) : isOverdue ? (
          <Warning size={20} className="text-red-600" weight="fill" />
        ) : (
          <Bell size={20} className="text-yellow-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold">{reminder.title}</h4>
        <p className="text-sm text-muted-foreground">
          {format(new Date(reminder.dueDate), 'MMM dd, yyyy')}
          {!reminder.completed &&
            (isOverdue
              ? ` • ${Math.abs(daysUntil)} days overdue`
              : daysUntil === 0
                ? ' • Due today'
                : ` • ${daysUntil} days away`)}
        </p>
        {reminder.description && <p className="text-sm mt-1">{reminder.description}</p>}
      </div>
      {!reminder.completed && (
        <Button size="sm" variant="outline" onClick={(): void => onComplete(reminder.id)}>
          Complete
        </Button>
      )}
    </AnimatedView>
  );
}

export function PetHealthDashboard({ pet, onClose }: PetHealthDashboardProps): JSX.Element {
  const [vaccinations, setVaccinations] = useStorage<VaccinationRecord[]>(
    `vaccinations-${pet.id}`,
    []
  );
  const [healthRecords, setHealthRecords] = useStorage<HealthRecord[]>(
    `health-records-${pet.id}`,
    []
  );
  const [reminders, setReminders] = useStorage<VetReminder[]>(`reminders-${pet.id}`, []);
  const [healthSummary, setHealthSummary] = useState<PetHealthSummary | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const modalAnimation = useModalAnimation({
    isVisible,
    duration: 300,
  });

  const handleClose = useCallback((): void => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const closeButtonAnimation = useBounceOnTap({
    onPress: handleClose,
    hapticFeedback: true,
  });

  useEffect(() => {
    setIsVisible(true);
    return () => {
      setIsVisible(false);
    };
  }, []);

  const generateHealthSummary = useCallback((): void => {
    try {
      const today = new Date();
      const upcomingVaccinations = (vaccinations || []).filter((v): boolean => {
        if (!v.nextDueDate) return false;
        const nextDate = new Date(v.nextDueDate);
        if (isNaN(nextDate.getTime())) return false;
        const todayDate = new Date(today);
        if (isNaN(todayDate.getTime())) return false;
        const daysUntil = differenceInDays(nextDate, todayDate);
        return daysUntil >= 0 && daysUntil <= 90;
      });

      const activeReminders = (reminders || []).filter((r): boolean => !r.completed);
      const recentRecords = (healthRecords || [])
        .sort((a, b): number => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      const checkups = (healthRecords || []).filter((r): boolean => r.type === 'checkup');
      const firstCheckup = checkups[0];
      const lastCheckup = firstCheckup?.date;

      const overdueVaccinations = upcomingVaccinations.filter((v): boolean =>
        Boolean(v.nextDueDate && isPast(new Date(v.nextDueDate)))
      );
      const dueSoonVaccinations = upcomingVaccinations.filter((v): boolean => {
        if (!v.nextDueDate) return false;
        const daysUntil = differenceInDays(new Date(v.nextDueDate), new Date());
        return daysUntil >= 0 && daysUntil <= 30;
      });

      const vaccinationStatus: PetHealthSummary['vaccinationStatus'] =
        overdueVaccinations.length > 0
          ? 'overdue'
          : dueSoonVaccinations.length > 0
            ? 'due-soon'
            : 'up-to-date';

      const summary: PetHealthSummary = {
        petId: pet.id,
        upcomingVaccinations,
        activeReminders,
        recentRecords,
        vaccinationStatus,
      };
      if (lastCheckup !== undefined) {
        summary.lastCheckup = lastCheckup;
      }
      setHealthSummary(summary);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to generate health summary', err, { petId: pet.id });
      toast.error('Failed to load health summary', {
        description: 'Please try again later',
      });
    }
  }, [vaccinations, healthRecords, reminders, pet.id]);

  useEffect(() => {
    generateHealthSummary();
  }, [generateHealthSummary]);

  const getStatusColor = useCallback((status: PetHealthSummary['vaccinationStatus']): string => {
    switch (status) {
      case 'up-to-date':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'due-soon':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    }
  }, []);

  const getStatusIcon = useCallback(
    (status: PetHealthSummary['vaccinationStatus']): JSX.Element => {
      switch (status) {
        case 'up-to-date':
          return <CheckCircle size={20} weight="fill" />;
        case 'due-soon':
          return <ClockCountdown size={20} weight="fill" />;
        case 'overdue':
          return <Warning size={20} weight="fill" />;
      }
    },
    []
  );

  const getStatusText = useCallback((status: PetHealthSummary['vaccinationStatus']): string => {
    switch (status) {
      case 'up-to-date':
        return 'Up to Date';
      case 'due-soon':
        return 'Due Soon';
      case 'overdue':
        return 'Overdue';
    }
  }, []);

  const handleAddVaccination = useCallback((): void => {
    try {
      const newVaccination: VaccinationRecord = {
        id: `vac-${Date.now()}`,
        petId: pet.id,
        type: 'rabies',
        name: 'Rabies Vaccination',
        date: new Date().toISOString().split('T')[0] ?? '',
        veterinarian: 'Dr. Smith',
        clinic: 'Happy Paws Veterinary',
        createdAt: new Date().toISOString(),
      };
      setVaccinations((current): VaccinationRecord[] => [...(current || []), newVaccination]);
      toast.success('Vaccination added', {
        description: 'Vaccination record created successfully',
      });
      logger.info('Vaccination added', { petId: pet.id, vaccinationId: newVaccination.id });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to add vaccination', err, { petId: pet.id });
      toast.error('Failed to add vaccination', { description: 'Please try again' });
    }
  }, [pet.id, setVaccinations]);

  const handleAddHealthRecord = useCallback((): void => {
    try {
      const newRecord: HealthRecord = {
        id: `health-${Date.now()}`,
        petId: pet.id,
        type: 'checkup',
        title: 'Annual Checkup',
        date: new Date().toISOString().split('T')[0] ?? '',
        description: 'Routine annual health examination',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setHealthRecords((current): HealthRecord[] => [...(current || []), newRecord]);
      toast.success('Health record added', {
        description: 'Health record created successfully',
      });
      logger.info('Health record added', { petId: pet.id, recordId: newRecord.id });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to add health record', err, { petId: pet.id });
      toast.error('Failed to add health record', { description: 'Please try again' });
    }
  }, [pet.id, setHealthRecords]);

  const handleAddReminder = useCallback((): void => {
    try {
      const newReminder: VetReminder = {
        id: `rem-${Date.now()}`,
        petId: pet.id,
        type: 'vaccination',
        title: 'Vaccination Due',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
        completed: false,
        notificationsSent: 0,
        createdAt: new Date().toISOString(),
      };
      setReminders((current): VetReminder[] => [...(current || []), newReminder]);
      toast.success('Reminder added', { description: 'Reminder created successfully' });
      logger.info('Reminder added', { petId: pet.id, reminderId: newReminder.id });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to add reminder', err, { petId: pet.id });
      toast.error('Failed to add reminder', { description: 'Please try again' });
    }
  }, [pet.id, setReminders]);

  const handleCompleteReminder = useCallback(
    (reminderId: string): void => {
      try {
        setReminders((current): VetReminder[] =>
          (current || []).map(
            (r): VetReminder =>
              r.id === reminderId
                ? { ...r, completed: true, completedAt: new Date().toISOString() }
                : r
          )
        );
        toast.success('Reminder completed', { description: 'Reminder marked as complete' });
        logger.info('Reminder completed', { petId: pet.id, reminderId });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to complete reminder', err, { petId: pet.id, reminderId });
        toast.error('Failed to complete reminder', { description: 'Please try again' });
      }
    },
    [pet.id, setReminders]
  );

  const sortedVaccinations = useMemo((): VaccinationRecord[] => {
    return (vaccinations || []).sort(
      (a, b): number => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [vaccinations]);

  const sortedHealthRecords = useMemo((): HealthRecord[] => {
    return (healthRecords || []).sort(
      (a, b): number => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [healthRecords]);

  const sortedReminders = useMemo((): VetReminder[] => {
    return (reminders || []).sort(
      (a, b): number => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [reminders]);

  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, timingConfigs.smooth);
  }, [backdropOpacity]);

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  }) as AnimatedStyle;

  return (
    <AnimatedView
      style={backdropStyle}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto"
    >
      <AnimatedView style={modalAnimation.style} className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Heart size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Health Dashboard</h1>
              <p className="text-sm text-muted-foreground">{pet.name}'s health records</p>
            </div>
          </div>
          <AnimatedView style={closeButtonAnimation.animatedStyle}>
            <Button variant="ghost" size="icon" onClick={closeButtonAnimation.handlePress} aria-label="X">
              <X size={24} />
            </Button>
          </AnimatedView>
        </div>

        {healthSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Syringe size={16} />
                  Vaccination Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  className={`${getStatusColor(healthSummary.vaccinationStatus)} flex items-center gap-1 w-fit`}
                >
                  {getStatusIcon(healthSummary.vaccinationStatus)}
                  {getStatusText(healthSummary.vaccinationStatus)}
                </Badge>
                {healthSummary.upcomingVaccinations.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {healthSummary.upcomingVaccinations.length} upcoming
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar size={16} />
                  Last Checkup
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthSummary.lastCheckup ? (
                  <div>
                    <p className="text-lg font-semibold">
                      {format(new Date(healthSummary.lastCheckup), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {differenceInDays(new Date(), new Date(healthSummary.lastCheckup))} days ago
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No checkups recorded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell size={16} />
                  Active Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{healthSummary.activeReminders.length}</p>
                <p className="text-xs text-muted-foreground">
                  {healthSummary.activeReminders.length === 0 ? 'All caught up!' : 'pending tasks'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="vaccinations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
            <TabsTrigger value="records">Health Records</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="vaccinations" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vaccination Records</CardTitle>
                    <CardDescription>Track all vaccination history</CardDescription>
                  </div>
                  <Button onClick={handleAddVaccination} size="sm">
                    <Plus size={16} className="mr-2" />
                    Add Vaccination
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-100">
                  {sortedVaccinations.length === 0 ? (
                    <div className="text-center py-12">
                      <Syringe size={48} className="mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No vaccination records yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedVaccinations.map((vac, index) => (
                        <VaccinationItem key={vac.id} vaccination={vac} index={index} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Health Records</CardTitle>
                    <CardDescription>All medical history and visits</CardDescription>
                  </div>
                  <Button onClick={handleAddHealthRecord} size="sm">
                    <Plus size={16} className="mr-2" />
                    Add Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-100">
                  {sortedHealthRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText size={48} className="mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No health records yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedHealthRecords.map((record, index) => (
                        <HealthRecordItem key={record.id} record={record} index={index} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reminders</CardTitle>
                    <CardDescription>Upcoming appointments and tasks</CardDescription>
                  </div>
                  <Button onClick={handleAddReminder} size="sm">
                    <Plus size={16} className="mr-2" />
                    Add Reminder
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-100">
                  {sortedReminders.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell size={48} className="mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No reminders set</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedReminders.map((reminder, index) => (
                        <ReminderItem
                          key={reminder.id}
                          reminder={reminder}
                          index={index}
                          onComplete={handleCompleteReminder}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedView>
    </AnimatedView>
  );
}

export default PetHealthDashboard;
