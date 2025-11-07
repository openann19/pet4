/**
 * Support API Service
 * 
 * Handles support ticket management endpoints for admin panel.
 */

import { APIClient } from '@/lib/api-client'
import { ENDPOINTS } from '@/lib/endpoints'
import { createLogger } from '@/lib/logger'
import type {
  SupportTicket,
  CreateSupportTicketData,
  UpdateSupportTicketData,
  SupportTicketMessage,
  CreateSupportTicketMessageData,
  SupportTicketFilter,
  SupportTicketStats
} from '@/lib/support-types'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('SupportApi')

class SupportApiImpl {
  /**
   * Create a new support ticket
   */
  async createTicket(data: CreateSupportTicketData): Promise<SupportTicket> {
    try {
      const response = await APIClient.post<SupportTicket>(
        ENDPOINTS.ADMIN.SUPPORT_TICKETS,
        data
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create support ticket', err, { userId: data.userId })
      throw err
    }
  }

  /**
   * Get list of support tickets with optional filters
   */
  async getTickets(filter?: SupportTicketFilter): Promise<SupportTicket[]> {
    try {
      const params = new URLSearchParams()
      if (isTruthy(filter?.status)) {
        filter.status.forEach(s => { params.append('status', s); })
      }
      if (isTruthy(filter?.priority)) {
        filter.priority.forEach(p => { params.append('priority', p); })
      }
      if (isTruthy(filter?.assignedTo)) {
        params.append('assignedTo', filter.assignedTo)
      }
      if (isTruthy(filter?.userId)) {
        params.append('userId', filter.userId)
      }
      if (isTruthy(filter?.tags)) {
        filter.tags.forEach(t => { params.append('tags', t); })
      }
      if (isTruthy(filter?.search)) {
        params.append('search', filter.search)
      }
      if (isTruthy(filter?.createdAfter)) {
        params.append('createdAfter', filter.createdAfter)
      }
      if (isTruthy(filter?.createdBefore)) {
        params.append('createdBefore', filter.createdBefore)
      }

      const queryString = params.toString()
      const url = queryString 
        ? `${String(ENDPOINTS.ADMIN.SUPPORT_TICKETS ?? '')}?${String(queryString ?? '')}`
        : ENDPOINTS.ADMIN.SUPPORT_TICKETS

      const response = await APIClient.get<SupportTicket[]>(url)
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get support tickets', err)
      return []
    }
  }

  /**
   * Get a single support ticket by ID
   */
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const response = await APIClient.get<SupportTicket>(
        ENDPOINTS.ADMIN.SUPPORT_TICKET(ticketId)
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get support ticket', err, { ticketId })
      return null
    }
  }

  /**
   * Update support ticket
   */
  async updateTicket(
    ticketId: string,
    updates: UpdateSupportTicketData
  ): Promise<SupportTicket> {
    try {
      const response = await APIClient.put<SupportTicket>(
        ENDPOINTS.ADMIN.SUPPORT_TICKET(ticketId),
        updates
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update support ticket', err, { ticketId })
      throw err
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status']
  ): Promise<SupportTicket> {
    try {
      const response = await APIClient.put<SupportTicket>(
        ENDPOINTS.ADMIN.SUPPORT_TICKET_STATUS(ticketId),
        { status }
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update ticket status', err, { ticketId, status })
      throw err
    }
  }

  /**
   * Assign ticket to admin/moderator
   */
  async assignTicket(
    ticketId: string,
    assignedTo: string
  ): Promise<SupportTicket> {
    try {
      const response = await APIClient.put<SupportTicket>(
        ENDPOINTS.ADMIN.SUPPORT_TICKET_ASSIGN(ticketId),
        { assignedTo }
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to assign ticket', err, { ticketId, assignedTo })
      throw err
    }
  }

  /**
   * Get messages for a ticket
   */
  async getTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    try {
      const response = await APIClient.get<SupportTicketMessage[]>(
        ENDPOINTS.ADMIN.SUPPORT_TICKET_MESSAGES(ticketId)
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get ticket messages', err, { ticketId })
      return []
    }
  }

  /**
   * Add message to ticket
   */
  async addTicketMessage(
    ticketId: string,
    data: CreateSupportTicketMessageData
  ): Promise<SupportTicketMessage> {
    try {
      const formData = new FormData()
      formData.append('message', data.message)
      
      if (isTruthy(data.attachments)) {
        data.attachments.forEach((file, index) => {
          formData.append(`attachment_${String(index ?? '')}`, file)
        })
      }

      const response = await APIClient.post<SupportTicketMessage>(
        ENDPOINTS.ADMIN.SUPPORT_TICKET_MESSAGES(ticketId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to add ticket message', err, { ticketId })
      throw err
    }
  }

  /**
   * Get support ticket statistics
   */
  async getStats(): Promise<SupportTicketStats> {
    try {
      const response = await APIClient.get<SupportTicketStats>(
        ENDPOINTS.ADMIN.SUPPORT_STATS
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get support stats', err)
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        },
        averageResolutionTime: 0
      }
    }
  }
}

export const supportApi = new SupportApiImpl()

