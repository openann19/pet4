import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStorage } from '@/hooks/use-storage';
import {
  CheckCircle,
  Flag,
  ListBullets,
  MagnifyingGlass,
  Prohibit,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useState } from 'react';

interface AuditEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export default function AuditLogView() {
  const [auditLog] = useStorage<AuditEntry[]>('admin-audit-log', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredEntries = (auditLog ?? []).filter((entry) => {
    const matchesSearch =
      entry.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.targetId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || entry.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const actionTypes = Array.from(new Set((auditLog ?? []).map((e) => e.action)));

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
            <p className="text-muted-foreground">Complete history of all admin actions</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                placeholder="Search by admin, action, or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-3">
          {filteredEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ActionIcon action={entry.action} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{entry.adminName}</span>
                            <ActionBadge action={entry.action} />
                            <span className="text-sm text-muted-foreground">
                              {entry.targetType}: {entry.targetId}
                            </span>
                          </div>

                          {entry.details && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              {JSON.stringify(entry.details, null, 2)}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-medium">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <Card className="p-12">
              <div className="text-center space-y-3">
                <ListBullets size={48} className="mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">No audit entries found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || filterAction !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Audit entries will appear here as admins take actions'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  const iconMap: Record<
    string,
    React.ComponentType<{ size?: number | string; className?: string; weight?: string }>
  > = {
    resolve_report: Flag,
    suspend_user: Prohibit,
    ban_user: Prohibit,
    reactivate_user: CheckCircle,
    approve_verification: ShieldCheck,
    deny_verification: ShieldCheck,
  };

  const Icon = iconMap[action] ?? ListBullets;

  return <Icon size={20} className="text-primary" weight="fill" />;
}

function ActionBadge({ action }: { action: string }) {
  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
  const variants: Record<string, { variant: BadgeVariant; label: string }> = {
    resolve_report: { variant: 'default', label: 'Resolved Report' },
    suspend_user: { variant: 'secondary', label: 'Suspended User' },
    ban_user: { variant: 'destructive', label: 'Banned User' },
    reactivate_user: { variant: 'default', label: 'Reactivated User' },
    approve_verification: { variant: 'default', label: 'Approved Verification' },
    deny_verification: { variant: 'secondary', label: 'Denied Verification' },
  };

  const config = variants[action] ?? {
    variant: 'outline',
    label: action.replace(/_/g, ' ').toUpperCase(),
  };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
