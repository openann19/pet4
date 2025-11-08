import { adminApi } from '@/api/admin-api';
import { createLogger } from '@/lib/logger';
import { PetProfileGenerator } from '@/components/admin/PetProfileGenerator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStorage } from '@/hooks/use-storage';
import type { Match, Pet } from '@/lib/types';
import {
  ChatCircle,
  CheckCircle,
  Clock,
  Flag,
  Heart,
  TrendDown,
  TrendUp,
  Users,
  type Icon,
} from '@phosphor-icons/react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useEffect, useState } from 'react';

interface Report {
  id: string;
  status: 'pending' | 'resolved' | 'dismissed';
  [key: string]: unknown;
}

interface Verification {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  [key: string]: unknown;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPets: number;
  totalMatches: number;
  totalMessages: number;
  pendingReports: number;
  pendingVerifications: number;
  resolvedReports: number;
}

export default function DashboardView() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPets: 0,
    totalMatches: 0,
    totalMessages: 0,
    pendingReports: 0,
    pendingVerifications: 0,
    resolvedReports: 0,
  });

  const [allPets] = useStorage<Pet[]>('all-pets', []);
  const [matches] = useStorage<Match[]>('user-matches', []);
  const [reports] = useStorage<Report[]>('admin-reports', []);
  const [verifications] = useStorage<Verification[]>('admin-verifications', []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const systemStats = await adminApi.getSystemStats();
        // Merge with local data for immediate UI updates
        const localStats = {
          totalUsers: new Set((allPets ?? []).map((p) => p.ownerId ?? p.ownerName)).size,
          activeUsers: Math.floor(
            new Set((allPets ?? []).map((p) => p.ownerId ?? p.ownerName)).size * 0.7
          ),
          totalPets: (allPets ?? []).length,
          totalMatches: (matches ?? []).length,
          totalMessages: systemStats.totalMessages,
          pendingReports: (reports ?? []).filter((r) => r.status === 'pending').length,
          pendingVerifications: (verifications ?? []).filter((v) => v.status === 'pending').length,
          resolvedReports: (reports ?? []).filter((r) => r.status === 'resolved').length,
        };
        // Use API stats when available, fallback to local calculations
        setStats({
          ...localStats,
          ...systemStats,
          // Keep local counts if API doesn't provide them
          totalMessages: systemStats.totalMessages ?? localStats.totalMessages,
        });
      } catch (error) {
        // Fallback to local calculations if API fails
        const logger = createLogger('DashboardView');
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warn(
          'Failed to load system stats from API, falling back to local calculations',
          err
        );
        const uniqueOwners = new Set((allPets ?? []).map((p) => p.ownerId ?? p.ownerName));
        setStats({
          totalUsers: uniqueOwners.size,
          activeUsers: Math.floor(uniqueOwners.size * 0.7),
          totalPets: (allPets ?? []).length,
          totalMatches: (matches ?? []).length,
          totalMessages: 0, // Can't calculate from local storage
          pendingReports: (reports ?? []).filter((r) => r.status === 'pending').length,
          pendingVerifications: (verifications ?? []).filter((v) => v.status === 'pending').length,
          resolvedReports: (reports ?? []).filter((r) => r.status === 'resolved').length,
        });
      }
    };

    void loadStats();
  }, [allPets, matches, reports, verifications]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      change: '+8%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Total Pets',
      value: stats.totalPets,
      change: '+15%',
      trend: 'up',
      icon: Heart,
      color: 'text-accent',
    },
    {
      title: 'Total Matches',
      value: stats.totalMatches,
      change: '+20%',
      trend: 'up',
      icon: Heart,
      color: 'text-pink-600',
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages,
      change: '+25%',
      trend: 'up',
      icon: ChatCircle,
      color: 'text-blue-600',
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      change: stats.pendingReports > 0 ? 'Needs attention' : 'All clear',
      trend: stats.pendingReports > 0 ? 'down' : 'up',
      icon: Flag,
      color: stats.pendingReports > 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      change: stats.pendingVerifications > 0 ? 'Needs review' : 'All clear',
      trend: 'neutral',
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: 'Resolved Reports',
      value: stats.resolvedReports,
      change: '+10%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">System overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.trend === 'up' ? TrendUp : stat.trend === 'down' ? TrendDown : Clock;

          return (
            <AnimatedView key={stat.title}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={stat.color} size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon size={14} className={stat.color} />
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedView>
          );
        })}
      </div>

      <div className="mb-6">
        <PetProfileGenerator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                icon={Users}
                title="New user registered"
                description="John D. joined the platform"
                time="2 minutes ago"
                type="info"
              />
              <ActivityItem
                icon={Heart}
                title="New match created"
                description="Max and Luna matched"
                time="5 minutes ago"
                type="success"
              />
              <ActivityItem
                icon={Flag}
                title="New report submitted"
                description="Content reported by user"
                time="10 minutes ago"
                type="warning"
              />
              <ActivityItem
                icon={CheckCircle}
                title="Verification approved"
                description="Photo verification completed"
                time="15 minutes ago"
                type="success"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Service status and uptime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <HealthItem service="API Server" status="operational" uptime="99.9%" />
              <HealthItem service="Realtime Gateway" status="operational" uptime="99.8%" />
              <HealthItem service="Media Service" status="operational" uptime="99.7%" />
              <HealthItem service="Database" status="operational" uptime="100%" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  icon: Icon;
  title: string;
  description: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

function ActivityItem({ icon: Icon, title, description, time, type }: ActivityItemProps) {
  const colorMap = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
    error: 'text-red-600',
  };

  return (
    <div className="flex items-start gap-4">
      <div className={`p-2 rounded-lg bg-muted ${colorMap[type]}`}>
        <Icon size={16} weight="fill" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

interface HealthItemProps {
  service: string;
  status: 'operational' | 'down';
  uptime: string;
}

function HealthItem({ service, status, uptime }: HealthItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${status === 'operational' ? 'bg-green-600' : 'bg-red-600'}`}
        />
        <span className="text-sm font-medium">{service}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          {uptime}
        </Badge>
        <Badge variant={status === 'operational' ? 'default' : 'destructive'}>{status}</Badge>
      </div>
    </div>
  );
}
