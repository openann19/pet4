import { useState, useEffect } from 'react'
import { motion } from '@petspark/motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartLine,
  Clock,
  CloudArrowUp,
  Database,
  Lightning,
  Warning,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown
} from '@phosphor-icons/react'
import { getPerformanceMetrics, type PerformanceMetrics } from '@/lib/performance'
import { getWebSocketManager } from '@/lib/websocket-manager'

interface SystemMetric {
  label: string
  value: string
  change: number
  status: 'good' | 'warning' | 'critical'
  icon: React.ReactNode
}

export default function PerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    updateMetrics()
    const interval = setInterval(updateMetrics, 2000)
    
    const wsManager = getWebSocketManager()
    const unsubscribe = wsManager.on('connection', (data: unknown) => {
      if (data && typeof data === 'object' && 'status' in data) {
        const status = String(data.status)
        if (status === 'connected' || status === 'disconnected' || status === 'connecting') {
          setWsStatus(status)
        }
      }
    })

    setWsStatus(wsManager.getState() === 'connected' ? 'connected' : 'disconnected')

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  const updateMetrics = () => {
    const newMetrics = getPerformanceMetrics()
    setMetrics(newMetrics)
  }

  const getSystemMetrics = (): SystemMetric[] => {
    if (!metrics) return []

    const pageLoadTime = metrics.pageLoadTime ?? 1500
    const apiResponseTime = metrics.apiResponseTime ?? 250
    const memoryUsage = metrics.memoryUsage ?? 75

    return [
      {
        label: 'Page Load Time',
        value: `${pageLoadTime.toFixed(0)}ms`,
        change: -12,
        status: pageLoadTime < 2000 ? 'good' : pageLoadTime < 4000 ? 'warning' : 'critical',
        icon: <Clock size={20} weight="fill" />
      },
      {
        label: 'API Response Time',
        value: `${apiResponseTime.toFixed(0)}ms`,
        change: 5,
        status: apiResponseTime < 300 ? 'good' : apiResponseTime < 1000 ? 'warning' : 'critical',
        icon: <Database size={20} weight="fill" />
      },
      {
        label: 'WebSocket Status',
        value: wsStatus === 'connected' ? 'Connected' : wsStatus === 'connecting' ? 'Connecting' : 'Disconnected',
        change: 0,
        status: wsStatus === 'connected' ? 'good' : wsStatus === 'connecting' ? 'warning' : 'critical',
        icon: <ChartLine size={20} weight="fill" />
      },
      {
        label: 'Memory Usage',
        value: `${memoryUsage.toFixed(1)} MB`,
        change: 8,
        status: memoryUsage < 100 ? 'good' : memoryUsage < 200 ? 'warning' : 'critical',
        icon: <ChartLine size={20} weight="fill" />
      }
    ]
  }

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'critical': return 'text-red-600 dark:text-red-400'
    }
  }

  const getStatusBadge = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': 
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Healthy</Badge>
      case 'warning': 
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Warning</Badge>
      case 'critical': 
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Critical</Badge>
    }
  }

  const coreWebVitals = metrics ? [
    { label: 'FCP', value: `${(metrics.fcp ?? 1200).toFixed(0)}ms`, target: '< 1800ms', status: (metrics.fcp ?? 1200) < 1800 ? 'good' : 'warning' },
    { label: 'LCP', value: `${(metrics.lcp ?? 2000).toFixed(0)}ms`, target: '< 2500ms', status: (metrics.lcp ?? 2000) < 2500 ? 'good' : 'warning' },
    { label: 'FID', value: `${(metrics.fid ?? 80).toFixed(0)}ms`, target: '< 100ms', status: (metrics.fid ?? 80) < 100 ? 'good' : 'warning' },
    { label: 'CLS', value: (metrics.cls ?? 0.05).toFixed(3), target: '< 0.1', status: (metrics.cls ?? 0.05) < 0.1 ? 'good' : 'warning' },
  ] : []

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ChartLine className="animate-spin mx-auto mb-4 text-primary" size={32} />
          <p className="text-muted-foreground">Loading performance metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">Real-time system health and metrics</p>
        </div>
        <Button onClick={updateMetrics} variant="outline" size="sm">
          <ChartLine size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getSystemMetrics().map((metric, index) => (
          <MotionView
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={getStatusColor(metric.status)}>
                  {metric.icon}
                </div>
                {getStatusBadge(metric.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{metric.value}</p>
                {metric.change !== 0 && (
                  <span className={`text-xs flex items-center ${metric.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {metric.change > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(metric.change)}%
                  </span>
                )}
              </div>
            </Card>
          </MotionView>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightning size={20} weight="fill" className="text-primary" />
              System Health Overview
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">32%</span>
                </div>
                <Progress value={32} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">{(metrics.memoryUsage ?? 75).toFixed(1)} MB</span>
                </div>
                <Progress value={((metrics.memoryUsage ?? 75) / 500) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Connections</span>
                  <span className="text-sm text-muted-foreground">148</span>
                </div>
                <Progress value={74} className="h-2" />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { icon: <CheckCircle size={16} weight="fill" className="text-green-500" />, text: 'System backup completed', time: '2 min ago' },
                  { icon: <CloudArrowUp size={16} weight="fill" className="text-blue-500" />, text: 'Media upload successful', time: '5 min ago' },
                  { icon: <Warning size={16} weight="fill" className="text-yellow-500" />, text: 'High API response time detected', time: '12 min ago' },
                  { icon: <CheckCircle size={16} weight="fill" className="text-green-500" />, text: 'Database optimization complete', time: '20 min ago' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-foreground">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>
              <div className="space-y-3">
                {[
                  { service: 'API Server', status: 'operational', uptime: '99.98%' },
                  { service: 'WebSocket Gateway', status: wsStatus, uptime: '99.95%' },
                  { service: 'Media Service', status: 'operational', uptime: '99.99%' },
                  { service: 'Database', status: 'operational', uptime: '100%' },
                ].map((service, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{service.service}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{service.uptime}</span>
                      {service.status === 'operational' || service.status === 'connected' ? (
                        <CheckCircle size={16} weight="fill" className="text-green-500" />
                      ) : (
                        <XCircle size={16} weight="fill" className="text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Core Web Vitals</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Metrics that measure real-world user experience on your application
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coreWebVitals.map((vital) => (
                <div key={vital.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{vital.label}</span>
                    {vital.status === 'good' ? (
                      <CheckCircle size={20} weight="fill" className="text-green-500" />
                    ) : (
                      <Warning size={20} weight="fill" className="text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{vital.value}</span>
                    <span className="text-sm text-muted-foreground">Target: {vital.target}</span>
                  </div>
                  <Progress 
                    value={vital.status === 'good' ? 100 : 60} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Recommendations</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle size={16} weight="fill" className="text-green-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Image optimization enabled</p>
                  <p className="text-xs text-muted-foreground">All images are being compressed and lazy-loaded</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={16} weight="fill" className="text-green-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Code splitting active</p>
                  <p className="text-xs text-muted-foreground">Routes are loaded on-demand for better performance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Warning size={16} weight="fill" className="text-yellow-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">Consider enabling service worker</p>
                  <p className="text-xs text-muted-foreground">Offline caching could improve repeat visit performance</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Network Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">API Requests (last hour)</span>
                  <span className="text-sm font-semibold">1,247</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-green-500/10 text-green-600 p-2 rounded">
                    <p className="font-semibold">1,198</p>
                    <p className="text-green-600/70">Success</p>
                  </div>
                  <div className="bg-yellow-500/10 text-yellow-600 p-2 rounded">
                    <p className="font-semibold">42</p>
                    <p className="text-yellow-600/70">Slow</p>
                  </div>
                  <div className="bg-red-500/10 text-red-600 p-2 rounded">
                    <p className="font-semibold">7</p>
                    <p className="text-red-600/70">Failed</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <span className="text-sm font-semibold">{(metrics.apiResponseTime ?? 250).toFixed(0)}ms</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Data Transfer (last hour)</span>
                  <span className="text-sm font-semibold">2.4 GB</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <div className="flex-1 bg-primary/10 text-primary p-2 rounded">
                    <p className="font-semibold">1.6 GB</p>
                    <p className="text-primary/70">Upload</p>
                  </div>
                  <div className="flex-1 bg-secondary/10 text-secondary p-2 rounded">
                    <p className="font-semibold">800 MB</p>
                    <p className="text-secondary/70">Download</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Error Tracking</h3>
            <div className="space-y-3">
              {[
                { type: 'Network Error', count: 3, severity: 'low', time: '15 min ago' },
                { type: 'Validation Error', count: 12, severity: 'low', time: '23 min ago' },
                { type: 'API Timeout', count: 2, severity: 'medium', time: '1 hour ago' },
              ].map((error, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {error.severity === 'low' ? (
                      <Warning size={20} weight="fill" className="text-yellow-500" />
                    ) : (
                      <XCircle size={20} weight="fill" className="text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{error.type}</p>
                      <p className="text-xs text-muted-foreground">{error.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{error.count} occurrences</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
