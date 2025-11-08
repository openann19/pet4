import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Globe,
  Database,
  Cpu,
  Cloud,
  Lock,
  Pulse,
  Stack,
  Network,
  Shield,
  Lightning,
} from '@phosphor-icons/react';

export default function SystemMap() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">System Architecture Map</h2>
        <p className="text-muted-foreground">
          Complete overview of PawfectMatch platform architecture and data flows
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="data">Data Flow</TabsTrigger>
          <TabsTrigger value="realtime">Real-Time</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Globe size={32} className="text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Client Applications</h3>
              <p className="text-sm text-muted-foreground mb-4">Multi-platform user interfaces</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Web App</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mobile App</span>
                  <Badge variant="secondary">Planned</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Admin Console</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Cpu size={32} className="text-accent mb-4" />
              <h3 className="text-xl font-bold mb-2">Business Logic</h3>
              <p className="text-sm text-muted-foreground mb-4">Core service modules</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Matching Engine</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chat Service</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Story Service</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Engine</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Database size={32} className="text-secondary mb-4" />
              <h3 className="text-xl font-bold mb-2">Data Layer</h3>
              <p className="text-sm text-muted-foreground mb-4">Persistent storage system</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Backend API</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Profiles</span>
                  <Badge variant="outline">2.5K records</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pet Profiles</span>
                  <Badge variant="outline">3.8K records</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Messages</span>
                  <Badge variant="outline">12K records</Badge>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Cloud size={24} />
              External Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-semibold mb-1">spark.llm (GPT)</div>
                <div className="text-xs text-muted-foreground">AI/ML Processing</div>
                <Badge variant="default" className="mt-2">
                  Connected
                </Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-semibold mb-1">spark.user()</div>
                <div className="text-xs text-muted-foreground">User Context</div>
                <Badge variant="default" className="mt-2">
                  Connected
                </Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-semibold mb-1">Media CDN</div>
                <div className="text-xs text-muted-foreground">Asset Delivery</div>
                <Badge variant="default" className="mt-2">
                  Connected
                </Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-semibold mb-1">Analytics</div>
                <div className="text-xs text-muted-foreground">Usage Tracking</div>
                <Badge variant="secondary" className="mt-2">
                  Planned
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Stack size={24} />
              Architecture Layers
            </h3>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-bold text-lg mb-2">Layer 1: Presentation</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    User-facing interfaces built with React and TypeScript
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Badge variant="outline">Web</Badge>
                      <span>React 19, TypeScript, Tailwind CSS, Framer Motion</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Badge variant="outline">Mobile</Badge>
                      <span>React Native (Planned)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Badge variant="outline">Admin</Badge>
                      <span>React Dashboard with moderation tools</span>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-bold text-lg mb-2">Layer 2: API Gateway</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Request routing, authentication, and rate limiting
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Badge variant="outline">REST</Badge>
                      <span>RESTful API endpoints</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Badge variant="outline">WebSocket</Badge>
                      <span>Real-time bidirectional communication</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Badge variant="outline">Auth</Badge>
                      <span>JWT-based authentication with refresh tokens</span>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h4 className="font-bold text-lg mb-2">Layer 3: Business Logic</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Core application services and algorithms
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm p-2 bg-muted rounded">Matching Engine</div>
                    <div className="text-sm p-2 bg-muted rounded">Chat Service</div>
                    <div className="text-sm p-2 bg-muted rounded">Story Service</div>
                    <div className="text-sm p-2 bg-muted rounded">Moderation Service</div>
                    <div className="text-sm p-2 bg-muted rounded">Media Service</div>
                    <div className="text-sm p-2 bg-muted rounded">Notification Service</div>
                    <div className="text-sm p-2 bg-muted rounded">Analytics Engine</div>
                    <div className="text-sm p-2 bg-muted rounded">AI Engine</div>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-bold text-lg mb-2">Layer 4: Data Layer</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Persistent storage using backend API endpoints
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Collections:</strong> Users, Pets, Matches, Messages, Stories,
                      Reports, Notifications, Audit Logs
                    </div>
                    <div className="text-sm">
                      <strong>Access Pattern:</strong> RESTful API endpoints with centralized data
                      management
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-bold text-lg mb-2">Layer 5: External Services</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Third-party integrations and APIs
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Badge>AI</Badge>
                      <span>spark.llm for GPT-4 powered features</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Badge>CDN</Badge>
                      <span>Unsplash for demo images, Cloudinary planned</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Badge>Auth</Badge>
                      <span>spark.user() for user context</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Swipe → Match → Chat Flow</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">User Swipes Right</div>
                    <div className="text-xs text-muted-foreground">
                      Action recorded in swipe-actions-{'{userId}'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Mutual Like Check</div>
                    <div className="text-xs text-muted-foreground">
                      Query opposite user's swipe history
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Match Created</div>
                    <div className="text-xs text-muted-foreground">
                      Store in matches-{'{userId}'} for both users
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Real-Time Notification</div>
                    <div className="text-xs text-muted-foreground">
                      Emit match_created event to both users
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">5</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Chat Room Ready</div>
                    <div className="text-xs text-muted-foreground">
                      Auto-provision chat with room ID
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Real-Time Message Flow</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Message Composed</div>
                    <div className="text-xs text-muted-foreground">
                      User types message in chat window
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Optimistic UI Update</div>
                    <div className="text-xs text-muted-foreground">
                      Show message immediately with 'sending' status
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Store in API</div>
                    <div className="text-xs text-muted-foreground">
                      Save to backend via REST API endpoint
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Socket Event</div>
                    <div className="text-xs text-muted-foreground">
                      Emit message_send event to recipient
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">5</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Delivery Confirmation</div>
                    <div className="text-xs text-muted-foreground">
                      Update status to 'delivered', then 'read'
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Story Publishing Flow</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Media Upload</div>
                    <div className="text-xs text-muted-foreground">Photo/video uploaded to CDN</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Story Created</div>
                    <div className="text-xs text-muted-foreground">
                      Store in stories-{'{userId}'} with 24h expiry
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Distribution</div>
                    <div className="text-xs text-muted-foreground">
                      Add to followers' feeds based on visibility
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">View Tracking</div>
                    <div className="text-xs text-muted-foreground">
                      Record viewers in story-views-{'{storyId}'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Admin Moderation Flow</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Report Submitted</div>
                    <div className="text-xs text-muted-foreground">
                      User flags inappropriate content
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Queue Entry</div>
                    <div className="text-xs text-muted-foreground">Added to moderation queue</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Moderator Review</div>
                    <div className="text-xs text-muted-foreground">
                      Admin console shows report details
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Action Taken</div>
                    <div className="text-xs text-muted-foreground">
                      Approve, warn, suspend, or ban
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">5</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Audit Log</div>
                    <div className="text-xs text-muted-foreground">
                      Action recorded with who/what/when/why
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lightning size={24} />
              WebSocket Event System
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Network size={20} />
                  /chat Namespace
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>join_room</code>
                    <div className="text-xs text-muted-foreground">Enter chat room</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>leave_room</code>
                    <div className="text-xs text-muted-foreground">Exit chat room</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>message_send</code>
                    <div className="text-xs text-muted-foreground">New message</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>message_delivered</code>
                    <div className="text-xs text-muted-foreground">Delivery confirm</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>message_read</code>
                    <div className="text-xs text-muted-foreground">Read receipt</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>typing_start</code>
                    <div className="text-xs text-muted-foreground">User typing</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>typing_stop</code>
                    <div className="text-xs text-muted-foreground">Stopped typing</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Pulse size={20} />
                  /presence Namespace
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>user_online</code>
                    <div className="text-xs text-muted-foreground">User goes online</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>user_offline</code>
                    <div className="text-xs text-muted-foreground">User goes offline</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>user_away</code>
                    <div className="text-xs text-muted-foreground">User is idle</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>status_update</code>
                    <div className="text-xs text-muted-foreground">Status change</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Pulse size={20} />
                  /notifications Namespace
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>match_created</code>
                    <div className="text-xs text-muted-foreground">New match alert</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>like_received</code>
                    <div className="text-xs text-muted-foreground">Someone liked pet</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>message_received</code>
                    <div className="text-xs text-muted-foreground">New message</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>story_viewed</code>
                    <div className="text-xs text-muted-foreground">Story view count</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>verification_complete</code>
                    <div className="text-xs text-muted-foreground">Pet verified</div>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <code>moderation_action</code>
                    <div className="text-xs text-muted-foreground">Mod decision</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Connection Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  WebSocket connects with valid JWT access token. On 401, attempts token refresh
                  once before disconnecting.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Offline Queue</h4>
                <p className="text-sm text-muted-foreground">
                  Events sent while offline are queued locally and flushed on reconnect with
                  exponential backoff.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Event Acknowledgment</h4>
                <p className="text-sm text-muted-foreground">
                  All events expect acknowledgment within 5 seconds. Unacknowledged events are
                  retried with timeout.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Heartbeat</h4>
                <p className="text-sm text-muted-foreground">
                  Client sends ping every 30 seconds. If no pong received in 10 seconds, connection
                  is considered dead.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lock size={24} />
                Authentication & Authorization
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">JWT Tokens</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Access token: 15 minute lifetime</li>
                    <li>• Refresh token: 7 day lifetime, rotating</li>
                    <li>• Web: httpOnly cookies + CSRF token</li>
                    <li>• Mobile: Secure encrypted storage</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Role-Based Access</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>User</span>
                      <Badge>Basic Access</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Moderator</span>
                      <Badge variant="secondary">Review & Moderate</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Admin</span>
                      <Badge variant="destructive">Full Control</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield size={24} />
                Security Controls
              </h3>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="font-semibold text-sm mb-1">Rate Limiting</div>
                  <div className="text-xs text-muted-foreground">
                    100 requests per minute per user across auth, chat, and uploads
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-semibold text-sm mb-1">Input Sanitization</div>
                  <div className="text-xs text-muted-foreground">
                    All user input sanitized to prevent XSS, SQL injection, and script tags
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-semibold text-sm mb-1">Content Moderation</div>
                  <div className="text-xs text-muted-foreground">
                    AI-powered inappropriate content detection before storage
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-semibold text-sm mb-1">Audit Logging</div>
                  <div className="text-xs text-muted-foreground">
                    Every admin action logged with actor, target, changes, and reason
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Privacy Controls</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Profile Visibility</span>
                  <Badge variant="outline">User Choice</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Location Sharing</span>
                  <Badge variant="outline">Opt-in</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Online Status</span>
                  <Badge variant="outline">Configurable</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Read Receipts</span>
                  <Badge variant="outline">Optional</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Story Visibility</span>
                  <Badge variant="outline">Tiered</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Data Protection</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <strong>Encryption:</strong> All data encrypted at rest and in transit using
                  industry-standard protocols
                </div>
                <div className="text-sm">
                  <strong>Retention:</strong> Messages retained 90 days for inactive conversations,
                  stories expire after 24 hours
                </div>
                <div className="text-sm">
                  <strong>Deletion:</strong> Users can permanently delete accounts with 30-day grace
                  period
                </div>
                <div className="text-sm">
                  <strong>Export:</strong> Users can export all their data in JSON format at any
                  time
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <h3 className="text-xl font-bold mb-2">Documentation</h3>
        <p className="text-muted-foreground mb-4">
          Complete system architecture documentation available in the repository
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">ARCHITECTURE.md</Badge>
          <Badge variant="outline">API Documentation</Badge>
          <Badge variant="outline">WebSocket Events</Badge>
          <Badge variant="outline">Data Contracts</Badge>
          <Badge variant="outline">Security Model</Badge>
        </div>
      </Card>
    </div>
  );
}
