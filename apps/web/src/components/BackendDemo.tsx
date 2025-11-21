import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { db, type QueryOptions } from '@/lib/database';
import { logger } from '@/lib/logger';
import {
  ArrowsClockwise,
  CheckCircle,
  Database,
  Eye,
  Trash,
  User,
  XCircle,
} from '@phosphor-icons/react';
import { isTruthy } from '@petspark/shared';
import { MotionView } from '@petspark/motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DemoRecord {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export default function BackendDemo() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [records, setRecords] = useState<DemoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [stats, setStats] = useState({ total: 0, myRecords: 0 });

  useEffect(() => {
    if (!authLoading && user) {
      void loadRecords();
      void loadStats();
    }
  }, [authLoading, user]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const queryOptions: QueryOptions<DemoRecord> = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 10,
      };
      if (user) {
        queryOptions.filter = { ownerId: user.id };
      }
      const result = await db.findMany<DemoRecord>('demo_records', queryOptions);
      setRecords(result.data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load records', err, { action: 'loadRecords', userId: user?.id });
      toast.error('Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const total = await db.count<DemoRecord>('demo_records');
      const myRecords = user ? await db.count<DemoRecord>('demo_records', { ownerId: user.id }) : 0;
      setStats({ total, myRecords });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load stats', err, { action: 'loadStats', userId: user?.id });
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user) {
      toast.error('You must be authenticated');
      return;
    }

    try {
      await db.create<DemoRecord>('demo_records', {
        title: title.trim(),
        content: content.trim(),
        ownerId: user.id,
      });

      toast.success('Record created successfully');
      setTitle('');
      setContent('');
      await loadRecords();
      await loadStats();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create record', err, { action: 'createRecord', userId: user?.id });
      toast.error('Failed to create record');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await db.delete<DemoRecord>('demo_records', id);
      toast.success('Record deleted');
      await loadRecords();
      await loadStats();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete record', err, { action: 'deleteRecord', recordId: id });
      toast.error('Failed to delete record');
    }
  };

  const handleClearAll = async () => {
    if (!user) return;

    try {
      const count = await db.deleteMany<DemoRecord>('demo_records', { ownerId: user.id });
      toast.success(`Deleted ${count} records`);
      await loadRecords();
      await loadStats();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to clear records', err, { action: 'clearRecords', userId: user?.id });
      toast.error('Failed to clear records');
    }
  };

  if (isTruthy(authLoading)) {
    return (
      <div className="flex items-center justify-center p-12">
        <ArrowsClockwise className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <MotionView
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
          Backend Integration Demo
        </h1>
        <p className="text-muted-foreground text-lg">
          Real database operations with Spark KV storage
        </p>
      </MotionView>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User size={24} className="text-primary" />
              <CardTitle className="text-lg">Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle size={20} className="text-green-500" weight="fill" />
                ) : (
                  <XCircle size={20} className="text-red-500" weight="fill" />
                )}
                <span className="text-sm font-medium">
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              {user && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong>Name:</strong> {user.displayName}
                  </p>
                  <p>
                    <strong>ID:</strong> {user.id.slice(0, 8)}...
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database size={24} className="text-accent" />
              <CardTitle className="text-lg">Database Stats</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Records:</span>
                <span className="font-bold">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">My Records:</span>
                <span className="font-bold text-primary">{stats.myRecords}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye size={24} className="text-secondary" />
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => {
                void loadRecords();
              }}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isLoading}
            >
              <ArrowsClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh Data
            </Button>
            <Button
              onClick={() => {
                void handleClearAll();
              }}
              variant="destructive"
              size="sm"
              className="w-full"
              disabled={!isAuthenticated || stats.myRecords === 0}
            >
              <Trash size={16} />
              Clear My Records
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Record</CardTitle>
          <CardDescription>
            Test database creation with your authenticated user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); }}
                placeholder="Enter a title..."
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Input
                id="content"
                value={content}
                onChange={(e) => { setContent(e.target.value); }}
                placeholder="Enter some content..."
                disabled={!isAuthenticated}
              />
            </div>
            <Button
              onClick={() => {
                void handleCreate();
              }}
              disabled={!isAuthenticated || !title.trim() || !content.trim()}
              className="w-full"
            >
              Create Record
            </Button>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground text-center">Sign in to create records</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Records</CardTitle>
          <CardDescription>
            Records stored in the Spark KV database (persists across sessions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <ArrowsClockwise className="animate-spin" size={24} />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No records yet. Create one above!
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record, index) => (
                <MotionView
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">{record.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {record.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Created: {new Date(record.createdAt).toLocaleString()}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>ID: {record.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        void handleDelete(record.id);
                      }}
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      className="shrink-0 w-10 h-10 p-0"
                      aria-label={`Delete record ${record.id}`}
                    >
                      <Trash size={18} />
                    </Button>
                  </div>
                </MotionView>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Database Service:</strong> Full CRUD operations with filtering, sorting, and
            pagination
          </div>
          <div>
            <strong>Authentication:</strong> GitHub OAuth via Spark user API with role-based access
          </div>
          <div>
            <strong>Persistence:</strong> All data stored in Spark KV (survives page refreshes)
          </div>
          <div>
            <strong>Type Safety:</strong> Full TypeScript support with type-safe queries
          </div>
          <div>
            <strong>Collections:</strong> MongoDB-like collections for organized data storage
          </div>
          <div className="pt-2 border-t">
            <p className="text-muted-foreground">
              See <code className="bg-background px-1 py-0.5 rounded">BACKEND_INTEGRATION.md</code>{' '}
              for complete API documentation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
