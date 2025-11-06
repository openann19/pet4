/**
 * Support Ticket Type Definitions
 * 
 * Types for support ticket management system used by admins
 * to handle user support requests and issues.
 */

export type SupportTicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface SupportTicket {
  id: string
  userId: string
  userName: string
  userEmail: string
  subject: string
  description: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
  tags: string[]
  relatedReportId?: string
  relatedUserId?: string
  relatedPetId?: string
}

export interface SupportTicketMessage {
  id: string
  ticketId: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  attachments?: SupportTicketAttachment[]
  isAdmin: boolean
  createdAt: string
  editedAt?: string
}

export interface SupportTicketAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  uploadedAt: string
}

export interface CreateSupportTicketData {
  userId: string
  subject: string
  description: string
  priority?: SupportTicketPriority
  relatedReportId?: string
  relatedUserId?: string
  relatedPetId?: string
  tags?: string[]
}

export interface UpdateSupportTicketData {
  status?: SupportTicketStatus
  priority?: SupportTicketPriority
  assignedTo?: string
  tags?: string[]
}

export interface CreateSupportTicketMessageData {
  message: string
  attachments?: File[]
}

export interface SupportTicketFilter {
  status?: SupportTicketStatus[]
  priority?: SupportTicketPriority[]
  assignedTo?: string
  userId?: string
  tags?: string[]
  search?: string
  createdAfter?: string
  createdBefore?: string
}

export interface SupportTicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  byPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  averageResolutionTime: number
  oldestOpenTicket?: string
}

