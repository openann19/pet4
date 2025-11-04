import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle, XCircle, Clock, ShieldCheck, IdentificationCard,
  User, Calendar, Warning, ArrowRight
} from '@phosphor-icons/react'
import { kycService } from '@/lib/backend-services'
import type { KYCSession, KYCRejectReason, KYCStatus } from '@/lib/backend-types'
import { toast } from 'sonner'

export function KYCManagement() {
  const [sessions, setSessions] = useState<KYCSession[]>([])
  const [selectedTab, setSelectedTab] = useState<KYCStatus | 'all'>('pending')
  const [selectedSession, setSelectedSession] = useState<KYCSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState<KYCRejectReason>('blurry_document')
  const [rejectText, setRejectText] = useState('')

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    const allSessions = await window.spark.kv.get<KYCSession[]>('kyc-sessions') || []
    setSessions(allSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  const filteredSessions = sessions.filter(s => {
    if (selectedTab === 'all') return true
    return s.status === selectedTab
  })

  const handleSessionClick = (session: KYCSession) => {
    setSelectedSession(session)
  }

  const handleVerify = async () => {
    if (!selectedSession) return
    
    setLoading(true)
    try {
      const user = await window.spark.user()
      if (!user) throw new Error('Not authenticated')
      
      await kycService.verifySession(selectedSession.id, user.id.toString())
      toast.success('KYC session verified!')
      await loadSessions()
      setSelectedSession(null)
    } catch {
      toast.error('Failed to verify session')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedSession || !rejectText) return
    
    setLoading(true)
    try {
      const user = await window.spark.user()
      if (!user) throw new Error('Not authenticated')
      
      await kycService.rejectSession(selectedSession.id, rejectReason, rejectText, user.id.toString())
      toast.success('KYC session rejected')
      await loadSessions()
      setSelectedSession(null)
      setRejectText('')
      setRejectReason('blurry_document')
    } catch {
      toast.error('Failed to reject session')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: KYCStatus) => {
    switch (status) {
      case 'verified': return 'text-green-500 bg-green-500/10'
      case 'rejected': return 'text-red-500 bg-red-500/10'
      case 'pending': return 'text-orange-500 bg-orange-500/10'
      case 'expired': return 'text-gray-500 bg-gray-500/10'
      case 'unverified': return 'text-blue-500 bg-blue-500/10'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  const getStatusIcon = (status: KYCStatus) => {
    switch (status) {
      case 'verified': return <CheckCircle size={16} weight="fill" />
      case 'rejected': return <XCircle size={16} weight="fill" />
      case 'pending': return <Clock size={16} />
      case 'expired': return <Warning size={16} />
      default: return <ShieldCheck size={16} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">KYC Verification Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and verify user identity documents
          </p>
        </div>
        <Button onClick={loadSessions} variant="outline">
          <Clock size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Sessions</div>
          <div className="text-2xl font-bold mt-1">{sessions.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold mt-1 text-orange-500">
            {sessions.filter(s => s.status === 'pending').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Verified</div>
          <div className="text-2xl font-bold mt-1 text-green-500">
            {sessions.filter(s => s.status === 'verified').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Rejected</div>
          <div className="text-2xl font-bold mt-1 text-red-500">
            {sessions.filter(s => s.status === 'rejected').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pass Rate</div>
          <div className="text-2xl font-bold mt-1">
            {sessions.length > 0 
              ? Math.round((sessions.filter(s => s.status === 'verified').length / sessions.length) * 100)
              : 0}%
          </div>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
        <TabsList className="w-full grid grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unverified">Unverified</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredSessions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <ShieldCheck size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No sessions in this category</p>
                  </motion.div>
                ) : (
                  filteredSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSessionClick(session)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={getStatusColor(session.status)}>
                                {getStatusIcon(session.status)}
                                <span className="ml-1">{session.status}</span>
                              </Badge>
                              <Badge variant="outline">{session.provider}</Badge>
                              {session.retryCount > 0 && (
                                <Badge variant="outline" className="text-orange-500">
                                  Retry #{session.retryCount}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User size={14} />
                                <span>User ID: {session.userId.substring(0, 16)}...</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <IdentificationCard size={14} />
                                <span>Documents: {session.documents.length}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar size={14} />
                                <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
                              </div>
                              {session.verifiedAt && (
                                <div className="flex items-center gap-2 text-green-500">
                                  <CheckCircle size={14} />
                                  <span>Verified: {new Date(session.verifiedAt).toLocaleString()}</span>
                                </div>
                              )}
                              {session.rejectedAt && (
                                <div className="flex items-center gap-2 text-red-500">
                                  <XCircle size={14} />
                                  <span>Rejected: {new Date(session.rejectedAt).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <ArrowRight size={20} className="text-muted-foreground shrink-0" />
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={selectedSession !== null} onOpenChange={() => {
        setSelectedSession(null)
        setRejectText('')
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Session Details</DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Session Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedSession.status)}>
                      {selectedSession.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-medium">{selectedSession.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(selectedSession.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{new Date(selectedSession.updatedAt).toLocaleString()}</span>
                  </div>
                  {selectedSession.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{new Date(selectedSession.expiresAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retry Count:</span>
                    <span>{selectedSession.retryCount}</span>
                  </div>
                </div>
              </Card>

              {selectedSession.documents.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Documents ({selectedSession.documents.length})</h3>
                  <div className="space-y-2">
                    {selectedSession.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium text-sm">{doc.type.replace('_', ' ')}</div>
                          <div className="text-xs text-muted-foreground">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={doc.verified ? 'default' : 'outline'}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {selectedSession.livenessCheck && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Liveness Check</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Passed:</span>
                      <Badge variant={selectedSession.livenessCheck.passed ? 'default' : 'destructive'}>
                        {selectedSession.livenessCheck.passed ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span>{(selectedSession.livenessCheck.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attempts:</span>
                      <span>{selectedSession.livenessCheck.attemptCount}</span>
                    </div>
                  </div>
                </Card>
              )}

              {selectedSession.rejectReason && (
                <Card className="p-4 border-destructive">
                  <h3 className="font-semibold mb-2 text-destructive">Rejection Reason</h3>
                  <p className="text-sm">
                    <strong>{selectedSession.rejectReason.replace('_', ' ')}:</strong>{' '}
                    {selectedSession.rejectReasonText}
                  </p>
                </Card>
              )}

              {selectedSession.status === 'pending' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                    <Select value={rejectReason} onValueChange={(v) => setRejectReason(v as KYCRejectReason)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blurry_document">Blurry Document</SelectItem>
                        <SelectItem value="expired_document">Expired Document</SelectItem>
                        <SelectItem value="document_mismatch">Document Mismatch</SelectItem>
                        <SelectItem value="liveness_failed">Liveness Check Failed</SelectItem>
                        <SelectItem value="unreadable">Unreadable</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                        <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Detailed Explanation</label>
                    <Textarea
                      value={rejectText}
                      onChange={(e) => setRejectText(e.target.value)}
                      placeholder="Provide specific feedback for the user..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleVerify} disabled={loading} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle size={16} className="mr-2" />
                      Verify & Approve
                    </Button>
                    <Button onClick={handleReject} disabled={loading || !rejectText} variant="destructive">
                      <XCircle size={16} className="mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
