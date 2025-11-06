/**
 * Shared Admin Types
 * 
 * Types shared between web and mobile admin panels.
 */

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'moderator'
  avatar?: string
}

export interface AdminAction {
  id: string
  adminId: string
  action: string
  targetType: string
  targetId: string
  details?: string
  timestamp: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalPets: number
  totalMatches: number
  totalMessages: number
  pendingReports: number
  pendingVerifications: number
  resolvedReports: number
}

export type AdminView = 
  | 'dashboard'
  | 'users'
  | 'reports'
  | 'moderation'
  | 'content-moderation'
  | 'chat-moderation'
  | 'support-chat'
  | 'kyc'
  | 'verification'
  | 'adoption'
  | 'adoption-applications'
  | 'adoption-listings'
  | 'community'
  | 'lost-found'
  | 'live-streams'
  | 'map-settings'
  | 'config'
  | 'audit'
  | 'settings'

