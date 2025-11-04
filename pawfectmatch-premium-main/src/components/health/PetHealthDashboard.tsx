import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Syringe,
  Calendar,
  Bell,
  Plus,
  FileText,
  Warning,
  CheckCircle,
  ClockCountdown,
  X
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Pet } from '@/lib/types'
import type {
  VaccinationRecord,
  HealthRecord,
  VetReminder,
  PetHealthSummary
} from '@/lib/health-types'
import { format, differenceInDays, isPast } from 'date-fns'
import { toast } from 'sonner'

interface PetHealthDashboardProps {
  pet: Pet
  onClose: () => void
}

export default function PetHealthDashboard({ pet, onClose }: PetHealthDashboardProps) {
  const [vaccinations, setVaccinations] = useStorage<VaccinationRecord[]>(
    `vaccinations-${pet.id}`,
    []
  )
  const [healthRecords, setHealthRecords] = useStorage<HealthRecord[]>(
    `health-records-${pet.id}`,
    []
  )
  const [reminders, setReminders] = useStorage<VetReminder[]>(`reminders-${pet.id}`, [])
  const [healthSummary, setHealthSummary] = useState<PetHealthSummary | null>(null)

  useEffect(() => {
    generateHealthSummary()
  }, [vaccinations, healthRecords, reminders])

  const generateHealthSummary = () => {
    const today = new Date()
    const upcomingVaccinations = (vaccinations || []).filter(v => {
      if (!v.nextDueDate) return false
      const nextDate = new Date(v.nextDueDate)
      if (isNaN(nextDate.getTime())) return false
      const todayDate = new Date(today)
      if (isNaN(todayDate.getTime())) return false
      const daysUntil = differenceInDays(nextDate, todayDate)
      return daysUntil >= 0 && daysUntil <= 90
    })

    const activeReminders = (reminders || []).filter(r => !r.completed)
    const recentRecords = (healthRecords || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    const checkups = (healthRecords || []).filter(r => r.type === 'checkup')
    const firstCheckup = checkups[0]
    const lastCheckup = firstCheckup?.date

    const overdueVaccinations = upcomingVaccinations.filter(v =>
      v.nextDueDate && isPast(new Date(v.nextDueDate))
    )
    const dueSoonVaccinations = upcomingVaccinations.filter(v => {
      if (!v.nextDueDate) return false
      const daysUntil = differenceInDays(new Date(v.nextDueDate), new Date())
      return daysUntil >= 0 && daysUntil <= 30
    })

    const vaccinationStatus: PetHealthSummary['vaccinationStatus'] =
      overdueVaccinations.length > 0
        ? 'overdue'
        : dueSoonVaccinations.length > 0
        ? 'due-soon'
        : 'up-to-date'

    setHealthSummary({
      petId: pet.id,
      lastCheckup,
      upcomingVaccinations,
      activeReminders,
      recentRecords,
      vaccinationStatus
    })
  }

  const getStatusColor = (status: PetHealthSummary['vaccinationStatus']) => {
    switch (status) {
      case 'up-to-date':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'due-soon':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
    }
  }

  const getStatusIcon = (status: PetHealthSummary['vaccinationStatus']) => {
    switch (status) {
      case 'up-to-date':
        return <CheckCircle size={20} weight="fill" />
      case 'due-soon':
        return <ClockCountdown size={20} weight="fill" />
      case 'overdue':
        return <Warning size={20} weight="fill" />
    }
  }

  const getStatusText = (status: PetHealthSummary['vaccinationStatus']) => {
    switch (status) {
      case 'up-to-date':
        return 'Up to Date'
      case 'due-soon':
        return 'Due Soon'
      case 'overdue':
        return 'Overdue'
    }
  }

  const handleAddVaccination = () => {
    const newVaccination: VaccinationRecord = {
      id: `vac-${Date.now()}`,
      petId: pet.id,
      type: 'rabies',
      name: 'Rabies Vaccination',
      date: new Date().toISOString().split('T')[0] ?? '',
      veterinarian: 'Dr. Smith' as string,
      clinic: 'Happy Paws Veterinary' as string,
      createdAt: new Date().toISOString()
    }
    setVaccinations(current => [...(current || []), newVaccination])
    toast.success('Vaccination added', { description: 'Vaccination record created successfully' })
  }

  const handleAddHealthRecord = () => {
    const newRecord: HealthRecord = {
      id: `health-${Date.now()}`,
      petId: pet.id,
      type: 'checkup',
      title: 'Annual Checkup',
      date: new Date().toISOString().split('T')[0] ?? '',
      description: 'Routine annual health examination',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setHealthRecords(current => [...(current || []), newRecord])
    toast.success('Health record added', {
      description: 'Health record created successfully'
    })
  }

  const handleAddReminder = () => {
    const newReminder: VetReminder = {
      id: `rem-${Date.now()}`,
      petId: pet.id,
      type: 'vaccination',
      title: 'Vaccination Due',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
      completed: false,
      notificationsSent: 0,
      createdAt: new Date().toISOString()
    }
    setReminders(current => [...(current || []), newReminder])
    toast.success('Reminder added', { description: 'Reminder created successfully' })
  }

  const handleCompleteReminder = (reminderId: string) => {
    setReminders(current =>
      (current || []).map(r =>
        r.id === reminderId
          ? { ...r, completed: true, completedAt: new Date().toISOString() }
          : r
      )
    )
    toast.success('Reminder completed', { description: 'Reminder marked as complete' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto"
    >
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
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
                <Badge className={`${getStatusColor(healthSummary.vaccinationStatus)} flex items-center gap-1 w-fit`}>
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
                  {healthSummary.activeReminders.length === 0
                    ? 'All caught up!'
                    : 'pending tasks'}
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
                <ScrollArea className="h-[400px]">
                  <AnimatePresence>
                    {(vaccinations || []).length === 0 ? (
                      <div className="text-center py-12">
                        <Syringe size={48} className="mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No vaccination records yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(vaccinations || [])
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((vac, index) => (
                            <motion.div
                              key={vac.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Syringe size={20} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold">{vac.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(vac.date), 'MMM dd, yyyy')} • {vac.veterinarian}
                                </p>
                                <p className="text-sm text-muted-foreground">{vac.clinic}</p>
                                {vac.nextDueDate && (
                                  <Badge variant="outline" className="mt-2">
                                    Next: {format(new Date(vac.nextDueDate), 'MMM dd, yyyy')}
                                  </Badge>
                                )}
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </AnimatePresence>
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
                <ScrollArea className="h-[400px]">
                  <AnimatePresence>
                    {(healthRecords || []).length === 0 ? (
                      <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No health records yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(healthRecords || [])
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((record, index) => (
                            <motion.div
                              key={record.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
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
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </AnimatePresence>
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
                <ScrollArea className="h-[400px]">
                  <AnimatePresence>
                    {(reminders || []).length === 0 ? (
                      <div className="text-center py-12">
                        <Bell size={48} className="mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No reminders set</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(reminders || [])
                          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                          .map((reminder, index) => {
                            const isOverdue = isPast(new Date(reminder.dueDate))
                            const daysUntil = differenceInDays(
                              new Date(reminder.dueDate),
                              new Date()
                            )

                            return (
                              <motion.div
                                key={reminder.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
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
                                    <CheckCircle
                                      size={20}
                                      className="text-green-600"
                                      weight="fill"
                                    />
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
                                  {reminder.description && (
                                    <p className="text-sm mt-1">{reminder.description}</p>
                                  )}
                                </div>
                                {!reminder.completed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCompleteReminder(reminder.id)}
                                  >
                                    Complete
                                  </Button>
                                )}
                              </motion.div>
                            )
                          })}
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}
