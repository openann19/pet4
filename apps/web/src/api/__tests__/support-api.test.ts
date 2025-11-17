/**
 * Support API tests
 * Tests support ticket management functionality
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { supportApi } from '@/api/support-api';
import type {
  SupportTicket,
  SupportTicketMessage,
  SupportTicketStats,
} from '@/lib/support-types';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let server: ReturnType<typeof createServer>;

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const bufferChunk: Buffer = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    chunks.push(bufferChunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as T) : ({} as T);
}

const mockTicket: SupportTicket = {
  id: 'ticket-1',
  userId: 'user-1',
  subject: 'Test Issue',
  description: 'Test description',
  status: 'open',
  priority: 'medium',
  category: 'technical',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: ['bug'],
};

const mockMessage: SupportTicketMessage = {
  id: 'msg-1',
  ticketId: 'ticket-1',
  userId: 'user-1',
  message: 'Test message',
  createdAt: new Date().toISOString(),
  attachments: [],
  isStaff: false,
};

const mockStats: SupportTicketStats = {
  total: 100,
  open: 10,
  inProgress: 20,
  resolved: 50,
  closed: 20,
  byPriority: {
    low: 30,
    medium: 40,
    high: 20,
    urgent: 10,
  },
  averageResolutionTime: 24,
};

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    void (async () => {
      if (!req.url || !req.method) {
        res.statusCode = 400;
        res.end();
        return;
      }

      const url = new URL(req.url, 'http://localhost:8080');

      // GET /admin/support/tickets
      if (req.method === 'GET' && url.pathname === '/admin/support/tickets') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: [mockTicket] }));
        return;
      }

      // GET /admin/support/tickets/:id
      if (req.method === 'GET' && url.pathname.startsWith('/admin/support/tickets/')) {
        const ticketId = url.pathname.split('/').pop();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { ...mockTicket, id: ticketId } }));
        return;
      }

      // POST /admin/support/tickets
      if (req.method === 'POST' && url.pathname === '/admin/support/tickets') {
        const payload = await readJson<{ subject: string; description: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { ...mockTicket, ...payload } }));
        return;
      }

      // PUT /admin/support/tickets/:id
      if (req.method === 'PUT' && url.pathname.match(/^\/admin\/support\/tickets\/[^/]+$/)) {
        const ticketId = url.pathname.split('/').pop();
        const payload = await readJson<Partial<SupportTicket>>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { ...mockTicket, id: ticketId, ...payload } }));
        return;
      }

      // PUT /admin/support/tickets/:id/status
      if (req.method === 'PUT' && url.pathname.match(/\/status$/)) {
        const payload = await readJson<{ status: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { ...mockTicket, status: payload.status } }));
        return;
      }

      // PUT /admin/support/tickets/:id/assign
      if (req.method === 'PUT' && url.pathname.match(/\/assign$/)) {
        const payload = await readJson<{ assignedTo: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { ...mockTicket, assignedTo: payload.assignedTo } }));
        return;
      }

      // GET /admin/support/tickets/:id/messages
      if (req.method === 'GET' && url.pathname.match(/\/messages$/)) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: [mockMessage] }));
        return;
      }

      // POST /admin/support/tickets/:id/messages
      if (req.method === 'POST' && url.pathname.match(/\/messages$/)) {
        const payload = await readJson<{ message: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { ...mockMessage, message: payload.message } }));
        return;
      }

      // GET /admin/support/stats
      if (req.method === 'GET' && url.pathname === '/admin/support/stats') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: mockStats }));
        return;
      }

      res.statusCode = 404;
      res.end();
    })();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        process.env.TEST_API_PORT = String(address.port);
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('SupportAPI', () => {
  describe('createTicket', () => {
    it('should create a support ticket', async () => {
      const data = {
        userId: 'user-1',
        subject: 'Test Issue',
        description: 'Test description',
        category: 'technical' as const,
        priority: 'medium' as const,
      };

      const ticket = await supportApi.createTicket(data);

      expect(ticket).toMatchObject({
        subject: 'Test Issue',
        description: 'Test description',
      });
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        supportApi.createTicket({
          userId: 'user-1',
          subject: 'Test',
          description: 'Test',
          category: 'technical',
          priority: 'low',
        })
      ).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('getTickets', () => {
    it('should return support tickets', async () => {
      const tickets = await supportApi.getTickets();

      expect(Array.isArray(tickets)).toBe(true);
      if (tickets.length > 0) {
        expect(tickets[0]).toHaveProperty('id');
        expect(tickets[0]).toHaveProperty('subject');
      }
    });

    it('should accept status filter', async () => {
      const tickets = await supportApi.getTickets({ status: ['open'] });
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('should accept priority filter', async () => {
      const tickets = await supportApi.getTickets({ priority: ['high', 'urgent'] });
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('should accept search filter', async () => {
      const tickets = await supportApi.getTickets({ search: 'test' });
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('should return empty array on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const tickets = await supportApi.getTickets();
      expect(tickets).toEqual([]);

      global.fetch = originalFetch;
    });
  });

  describe('getTicket', () => {
    it('should return a single ticket', async () => {
      const ticket = await supportApi.getTicket('ticket-1');

      expect(ticket).not.toBeNull();
      expect(ticket).toHaveProperty('id');
    });

    it('should return null on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const ticket = await supportApi.getTicket('ticket-1');
      expect(ticket).toBeNull();

      global.fetch = originalFetch;
    });
  });

  describe('updateTicket', () => {
    it('should update ticket', async () => {
      const ticket = await supportApi.updateTicket('ticket-1', {
        subject: 'Updated Subject',
      });

      expect(ticket).toHaveProperty('id');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(supportApi.updateTicket('ticket-1', { subject: 'Test' })).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status', async () => {
      const ticket = await supportApi.updateTicketStatus('ticket-1', 'in-progress');

      expect(ticket).toHaveProperty('status');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(supportApi.updateTicketStatus('ticket-1', 'closed')).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to user', async () => {
      const ticket = await supportApi.assignTicket('ticket-1', 'admin-1');

      expect(ticket).toHaveProperty('id');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(supportApi.assignTicket('ticket-1', 'admin-1')).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('getTicketMessages', () => {
    it('should return ticket messages', async () => {
      const messages = await supportApi.getTicketMessages('ticket-1');

      expect(Array.isArray(messages)).toBe(true);
    });

    it('should return empty array on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const messages = await supportApi.getTicketMessages('ticket-1');
      expect(messages).toEqual([]);

      global.fetch = originalFetch;
    });
  });

  describe('addTicketMessage', () => {
    it('should add message to ticket', async () => {
      const message = await supportApi.addTicketMessage('ticket-1', {
        message: 'Test message',
      });

      expect(message).toHaveProperty('message');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        supportApi.addTicketMessage('ticket-1', { message: 'Test' })
      ).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('getStats', () => {
    it('should return support statistics', async () => {
      const stats = await supportApi.getStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('open');
      expect(stats).toHaveProperty('byPriority');
    });

    it('should return default stats on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const stats = await supportApi.getStats();
      expect(stats.total).toBe(0);

      global.fetch = originalFetch;
    });
  });
});
