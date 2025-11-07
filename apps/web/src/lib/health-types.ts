export type VaccinationType = 
  | 'rabies'
  | 'distemper'
  | 'parvovirus'
  | 'bordetella'
  | 'leptospirosis'
  | 'lyme'
  | 'influenza'
  | 'other'

export type HealthRecordType =
  | 'vaccination'
  | 'checkup'
  | 'illness'
  | 'injury'
  | 'medication'
  | 'surgery'
  | 'dental'
  | 'other'

export interface VaccinationRecord {
  id: string
  petId: string
  type: VaccinationType
  name: string
  date: string
  nextDueDate?: string
  veterinarian: string
  clinic: string
  notes?: string
  documentUrl?: string
  createdAt: string
}

export interface HealthRecord {
  id: string
  petId: string
  type: HealthRecordType
  title: string
  date: string
  veterinarian?: string
  clinic?: string
  description: string
  diagnosis?: string
  treatment?: string
  medications?: string[]
  cost?: number
  followUpDate?: string
  documentUrls?: string[]
  createdAt: string
  updatedAt: string
}

export interface VetReminder {
  id: string
  petId: string
  type: 'vaccination' | 'checkup' | 'medication' | 'other'
  title: string
  dueDate: string
  description?: string
  completed: boolean
  completedAt?: string
  notificationsSent: number
  createdAt: string
}

export interface PetHealthSummary {
  petId: string
  lastCheckup?: string
  nextCheckup?: string
  upcomingVaccinations: VaccinationRecord[]
  activeReminders: VetReminder[]
  recentRecords: HealthRecord[]
  vaccinationStatus: 'up-to-date' | 'due-soon' | 'overdue'
}
