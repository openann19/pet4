/**
 * Support Chat Panel
 *
 * Admin panel for managing support tickets and customer service interactions.
 */

'use client';

import { supportApi } from '@/api/support-api';
import { adminApi } from '@/api/admin-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useStorage } from '@/hooks/use-storage';
import { createLogger } from '@/lib/logger';
import type {
  SupportTicket,
  SupportTicketMessage,
  SupportTicketFilter,
  SupportTicketStats,
} from '@/lib/support-types';
import type { User } from '@/lib/user-service';
import {
  ChatCircle,
  CheckCircle,
  Clock,
  Envelope,
  MagnifyingGlass,
  PaperPlaneTilt,
  Plus,
  User as UserIcon,
  XCircle,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('SupportChatPanel');

export default function SupportChatPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [filter, setFilter] = useState<SupportTicketFilter>({});
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [currentUser] = useStorage<User | null>('current-user', null);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filter, activeTab]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const statusFilter: SupportTicket['status'][] =
        activeTab === 'all'
          ? []
          : activeTab === 'open'
            ? ['open']
            : activeTab === 'in-progress'
              ? ['in-progress']
              : ['resolved', 'closed'];

      const ticketsData = await supportApi.getTickets({
        ...filter,
        status: statusFilter.length > 0 ? statusFilter : filter.status,
      });
      setTickets(ticketsData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load tickets', err);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await supportApi.getStats();
      setStats(statsData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load stats', err);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const messagesData = await supportApi.getTicketMessages(ticketId);
      setMessages(
        messagesData.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load messages', err);
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const message = await supportApi.addTicketMessage(selectedTicket.id, {
        message: newMessage,
      });
      setMessages([...messages, message]);
      setNewMessage('');

      await adminApi.createAuditLog({
        adminId: currentUser?.id || 'admin',
        action: 'support_ticket_message',
        targetType: 'support_ticket',
        targetId: selectedTicket.id,
        details: JSON.stringify({ messageId: message.id }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send message', err);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (status: SupportTicket['status']) => {
    if (!selectedTicket) return;

    try {
      const updated = await supportApi.updateTicketStatus(selectedTicket.id, status);
      setSelectedTicket(updated);
      setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(`Ticket ${status}`);

      await adminApi.createAuditLog({
        adminId: currentUser?.id || 'admin',
        action: 'support_ticket_status_update',
        targetType: 'support_ticket',
        targetId: selectedTicket.id,
        details: JSON.stringify({ status }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update status', err);
      toast.error('Failed to update ticket status');
    }
  };

  const handleAssignTicket = async (assignedTo: string) => {
    if (!selectedTicket) return;

    try {
      const updated = await supportApi.assignTicket(selectedTicket.id, assignedTo);
      setSelectedTicket(updated);
      setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Ticket assigned');

      await adminApi.createAuditLog({
        adminId: currentUser?.id || 'admin',
        action: 'support_ticket_assign',
        targetType: 'support_ticket',
        targetId: selectedTicket.id,
        details: JSON.stringify({ assignedTo }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to assign ticket', err);
      toast.error('Failed to assign ticket');
    }
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      urgent: 'destructive',
    } as const;

    return <Badge variant={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    const variants = {
      open: 'destructive',
      'in-progress': 'default',
      resolved: 'secondary',
      closed: 'outline',
    } as const;

    const icons = {
      open: <Clock size={12} className="mr-1" />,
      'in-progress': <Clock size={12} className="mr-1" />,
      resolved: <CheckCircle size={12} className="mr-1" />,
      closed: <XCircle size={12} className="mr-1" />,
    };

    return (
      <Badge variant={variants[status]}>
        {icons[status]}
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
            <p className="text-muted-foreground">Manage customer support requests and issues</p>
          </div>
          <Button onClick={() => setCreateTicketOpen(true)}>
            <Plus size={16} className="mr-2" />
            Create Ticket
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Tickets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-destructive">{stats.open}</div>
                <div className="text-sm text-muted-foreground">Open</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.closed}</div>
                <div className="text-sm text-muted-foreground">Closed</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                placeholder="Search tickets..."
                value={filter.search || ''}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              if (v === 'all' || v === 'open' || v === 'in-progress' || v === 'resolved') {
                setActiveTab(v);
              }
            }}
            className="flex-1 flex flex-col"
          >
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 m-0 mt-4">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No tickets found</div>
                  ) : (
                    tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className={`cursor-pointer hover:bg-muted transition-colors ${
                          selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleSelectTicket(ticket)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{ticket.subject}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {ticket.userName}
                              </p>
                            </div>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            {getStatusBadge(ticket.status)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedTicket ? (
            <>
              <div className="border-b border-border p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) => {
                        if (
                          v === 'open' ||
                          v === 'in-progress' ||
                          v === 'resolved' ||
                          v === 'closed'
                        ) {
                          handleUpdateStatus(v);
                        }
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">User:</span>{' '}
                    <span className="font-medium">{selectedTicket.userName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{selectedTicket.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedTicket.assignedTo && (
                    <div>
                      <span className="text-muted-foreground">Assigned to:</span>{' '}
                      <span className="font-medium">
                        {selectedTicket.assignedToName || selectedTicket.assignedTo}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.isAdmin ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.userAvatar} />
                        <AvatarFallback>
                          {message.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${message.isAdmin ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{message.userName}</span>
                          {message.isAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            message.isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey) {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    size="icon"
                    className="h-[80px]"
                  >
                    <PaperPlaneTilt size={20} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ticket selected</h3>
                <p className="text-muted-foreground">
                  Select a ticket from the list to view details and messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Create a new support ticket for a user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input placeholder="Enter user ID" />
            </div>
            <div>
              <Label>Subject</Label>
              <Input placeholder="Enter ticket subject" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Enter ticket description" rows={5} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTicketOpen(false)}>
              Cancel
            </Button>
            <Button>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
