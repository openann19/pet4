export type PlaydateStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type PlaydateType = 'park' | 'walk' | 'playdate' | 'training' | 'event' | 'other'

export interface PlaydateLocation {
  name: string
  address: string
  lat?: number
  lng?: number
  type?: 'park' | 'cafe' | 'beach' | 'trail' | 'home' | 'other'
}

export interface Playdate {
  id: string
  matchId: string
  petIds: string[]
  ownerIds: string[]
  title: string
  type: PlaydateType
  date: string
  startTime: string
  endTime: string
  location: PlaydateLocation
  description?: string
  status: PlaydateStatus
  createdBy: string
  confirmedBy?: string[]
  notes?: string
  reminderSent: boolean
  createdAt: string
  updatedAt: string
}

export interface PlaydateInvitation {
  id: string
  playdateId: string
  recipientId: string
  senderId: string
  status: 'pending' | 'accepted' | 'declined'
  message?: string
  createdAt: string
  respondedAt?: string
}
