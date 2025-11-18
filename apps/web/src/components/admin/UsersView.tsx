import { adminApi } from '@/api/admin-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { badgeVariants } from '@/components/ui/badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStorage } from '@/hooks/use-storage';
import type { Pet } from '@/lib/types';
import { createLogger } from '@/lib/logger';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import type { Icon } from '@phosphor-icons/react';
import {
  Calendar,
  CheckCircle,
  Envelope,
  Eye,
  Key,
  MagnifyingGlass,
  Prohibit,
  User,
  Warning,
} from '@phosphor-icons/react';
import type { VariantProps } from 'class-variance-authority';
import { MotionView } from '@petspark/motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('UsersView');

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  joinedAt: string;
  lastActive: string;
  petsCount: number;
  matchesCount: number;
  reportsCount: number;
}

export default function UsersView() {
  const [allPets] = useStorage<Pet[]>('all-pets', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState<'email' | 'manual'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'banned'>(
    'all'
  );

  useEffect(() => {
    if (allPets && allPets.length > 0) {
      const userMap = new Map<string, UserData>();

      allPets.forEach((pet: Pet) => {
        const ownerId = pet.ownerId || pet.ownerName || 'unknown';
        const ownerName = pet.ownerName || 'Unknown User';

        if (!userMap.has(ownerId)) {
          userMap.set(ownerId, {
            id: ownerId,
            name: ownerName,
            email: `${String(ownerName.toLowerCase().replace(/\s+/g, '.') ?? '')}@example.com`,
            role: 'user',
            status: 'active',
            joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            lastActive: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            petsCount: 0,
            matchesCount: Math.floor(Math.random() * 10),
            reportsCount: Math.floor(Math.random() * 3),
          });
        }

        const user = userMap.get(ownerId)!;
        user.petsCount++;
      });

      setUsers(Array.from(userMap.values()));
    }
  }, [allPets]);

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleSuspendUser = async (userId: string) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, status: 'suspended' as const } : u
    );
    setUsers(updatedUsers);
    setDialogOpen(false);
    toast.success('User suspended');

    const auditEntry = {
      adminId: 'admin-current',
      action: 'suspend_user',
      targetType: 'user',
      targetId: userId,
      details: JSON.stringify({ duration: '7 days' }),
    };

    await adminApi.createAuditLog(auditEntry);
  };

  const handleBanUser = async (userId: string) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, status: 'banned' as const } : u
    );
    setUsers(updatedUsers);
    setDialogOpen(false);
    toast.success('User banned permanently');

    const auditEntry = {
      adminId: 'admin-current',
      action: 'ban_user',
      targetType: 'user',
      targetId: userId,
      details: JSON.stringify({ permanent: true }),
    };

    await adminApi.createAuditLog(auditEntry);
  };

  const handleReactivateUser = async (userId: string) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, status: 'active' as const } : u
    );
    setUsers(updatedUsers);
    setDialogOpen(false);
    toast.success('User reactivated');

    const auditEntry = {
      adminId: 'admin-current',
      action: 'reactivate_user',
      targetType: 'user',
      targetId: userId,
    };

    await adminApi.createAuditLog(auditEntry);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setResettingPassword(true);

      const result = await adminApi.resetUserPassword(selectedUser.id, {
        sendEmail: resetPasswordMode === 'email',
        ...(resetPasswordMode === 'manual' && newPassword ? { newPassword } : {}),
      });

      if (result.success) {
        toast.success(result.message || 'Password reset successful');

        const auditEntry = {
          adminId: 'admin-current',
          action: 'reset_user_password',
          targetType: 'user',
          targetId: selectedUser.id,
          details: JSON.stringify({ mode: resetPasswordMode }),
        };
        await adminApi.createAuditLog(auditEntry);

        setResetPasswordDialogOpen(false);
        setNewPassword('');
        setResetPasswordMode('email');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error('Failed to reset password: ' + err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const openResetPasswordDialog = () => {
    setResetPasswordDialogOpen(true);
    setResetPasswordMode('email');
    setNewPassword('');
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === 'active').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;
  const bannedCount = users.filter((u) => u.status === 'banned').length;

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage users and their permissions</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); }}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <Tabs
          value={filterStatus}
          onValueChange={(v: string) => {
            if (v === 'all' || v === 'active' || v === 'suspended' || v === 'banned') {
              setFilterStatus(v);
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All ({users.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="suspended">Suspended ({suspendedCount})</TabsTrigger>
            <TabsTrigger value="banned">Banned ({bannedCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, index) => {
            const entryAnimation = useEntryAnimation({
              initialScale: 0.95,
              initialOpacity: 0,
              delay: index * 30
            })
            
            return (
              <MotionView key={user.id} initial="hidden" animate="visible" variants={entryAnimation.variants}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{user.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <StatusBadge status={user.status} />
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User size={14} />
                            <span>{user.petsCount} pets</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle size={14} />
                            <span>{user.matchesCount} matches</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar size={14} />
                            <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => { handleViewUser(user); }}
                        >
                          <Eye size={16} className="mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </MotionView>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <User size={48} className="mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">No users found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'No users match the selected filters'}
              </p>
            </div>
          </Card>
        )}
      </ScrollArea>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View and manage user information</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                    <StatusBadge status={selectedUser.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Envelope size={14} />
                    {selectedUser.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  label="Total Pets"
                  value={selectedUser.petsCount.toString()}
                  icon={User}
                />
                <InfoCard
                  label="Total Matches"
                  value={selectedUser.matchesCount.toString()}
                  icon={CheckCircle}
                />
                <InfoCard
                  label="Reports Filed"
                  value={selectedUser.reportsCount.toString()}
                  icon={Warning}
                />
                <InfoCard label="Account Role" value={selectedUser.role} icon={User} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="font-medium">
                    {new Date(selectedUser.joinedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Active:</span>
                  <span className="font-medium">
                    {new Date(selectedUser.lastActive).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedUser?.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedUser) return;
                    void handleSuspendUser(selectedUser.id).catch((error) => {
                      const err = error instanceof Error ? error : new Error(String(error));
                      logger.error('Failed to suspend user', err, { userId: selectedUser.id });
                      toast.error('Failed to suspend user: ' + err.message);
                    });
                  }}
                >
                  <Warning size={16} className="mr-2" />
                  Suspend (7 days)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!selectedUser) return;
                    void handleBanUser(selectedUser.id).catch((error) => {
                      const err = error instanceof Error ? error : new Error(String(error));
                      logger.error('Failed to ban user', err, { userId: selectedUser.id });
                      toast.error('Failed to ban user: ' + err.message);
                    });
                  }}
                >
                  <Prohibit size={16} className="mr-2" />
                  Ban Permanently
                </Button>
              </>
            )}
            {(selectedUser?.status === 'suspended' || selectedUser?.status === 'banned') && (
              <Button
                variant="default"
                onClick={() => {
                  if (!selectedUser) return;
                  void handleReactivateUser(selectedUser.id).catch((error) => {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger.error('Failed to reactivate user', err, { userId: selectedUser.id });
                    toast.error('Failed to reactivate user: ' + err.message);
                  });
                }}
              >
                <CheckCircle size={16} className="mr-2" />
                Reactivate User
              </Button>
            )}
            <Button variant="outline" onClick={() => void openResetPasswordDialog()}>
              <Key size={16} className="mr-2" />
              Reset Password
            </Button>
            <Button variant="outline" onClick={() => { setDialogOpen(false); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.name ?? selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={resetPasswordMode === 'email' ? 'default' : 'outline'}
                onClick={() => { setResetPasswordMode('email'); }}
                className="flex-1"
              >
                Send Reset Email
              </Button>
              <Button
                variant={resetPasswordMode === 'manual' ? 'default' : 'outline'}
                onClick={() => { setResetPasswordMode('manual'); }}
                className="flex-1"
              >
                Set New Password
              </Button>
            </div>

            {resetPasswordMode === 'manual' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); }}
                  placeholder="Enter new password"
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>
            )}

            {resetPasswordMode === 'email' && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  A password reset email will be sent to {selectedUser?.email}. The user will
                  receive a secure link to reset their password.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setNewPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleResetPassword().catch((error) => {
                  const err = error instanceof Error ? error : new Error(String(error));
                  logger.error('Failed to reset password', err, {
                    userId: selectedUser?.id,
                    mode: resetPasswordMode,
                  });
                  toast.error('Failed to reset password: ' + err.message);
                });
              }}
              disabled={
                resettingPassword || (resetPasswordMode === 'manual' && newPassword.length < 8)
              }
            >
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StatusVariant {
  variant: BadgeVariant;
  label: string;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, StatusVariant> = {
    active: { variant: 'default', label: 'Active' },
    suspended: { variant: 'secondary', label: 'Suspended' },
    banned: { variant: 'destructive', label: 'Banned' },
  };

  const config = variants[status] ?? variants.active;
  if (!config) return null;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

interface InfoCardProps {
  label: string;
  value: string | number;
  icon: Icon;
}

function InfoCard({ label, value, icon: Icon }: InfoCardProps) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-2xl font-bold capitalize">{value}</div>
    </div>
  );
}
