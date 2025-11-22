import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isTruthy } from '@petspark/shared';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStorage } from '@/hooks/use-storage';
import { cn } from '@/lib/utils';
import { VerificationService } from '@/lib/verification-service';
import {
  DOCUMENT_TYPE_DESCRIPTIONS,
  DOCUMENT_TYPE_LABELS,
  VERIFICATION_REQUIREMENTS,
  type DocumentType,
  type VerificationLevel,
  type VerificationRequest,
} from '@/lib/verification-types';
import {
  Certificate,
  CheckCircle,
  Clock,
  Info,
  ShieldCheck,
  Star,
  TrendUp,
  UploadSimple,
  XCircle,
} from '@phosphor-icons/react';
import { motion, MotionView } from '@petspark/motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { DocumentUploadCard } from './DocumentUploadCard';
import { VerificationLevelSelector } from './VerificationLevelSelector';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  userId: string;
}

export function VerificationDialog({ open, onOpenChange, petId, userId }: VerificationDialogProps) {
  const [verificationRequests, setVerificationRequests] = useStorage<
    Record<string, VerificationRequest>
  >('verification-requests', {});
  const [currentRequest, setCurrentRequest] = useState<VerificationRequest | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevel>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulatingReview, setIsSimulatingReview] = useState(false);

  const existingRequest = verificationRequests?.[petId];
  const activeRequest = currentRequest ?? existingRequest;

  const requirements = VERIFICATION_REQUIREMENTS[selectedLevel];
  const completionPercentage = activeRequest
    ? VerificationService.calculateCompletionPercentage(
      activeRequest,
      requirements.requiredDocuments
    )
    : 0;

  const handleStartVerification = () => {
    const request = VerificationService.createVerificationRequest(petId, userId, selectedLevel);
    setCurrentRequest(request);
    toast.success('Verification process started!', {
      description: `Selected ${selectedLevel} verification level`,
    });
  };

  const handleDocumentUpload = async (file: File, documentType: DocumentType) => {
    if (!activeRequest) return;

    if (!VerificationService.validateFileSize(file)) {
      toast.error('File too large', {
        description: 'Maximum file size is 10MB',
      });
      return;
    }

    if (!VerificationService.validateFileType(file)) {
      toast.error('Invalid file type', {
        description: 'Only JPG, PNG, WEBP, and PDF files are allowed',
      });
      return;
    }

    try {
      const document = await VerificationService.uploadDocument(
        file,
        documentType,
        activeRequest.id
      );
      const updatedRequest = {
        ...activeRequest,
        documents: [...activeRequest.documents, document],
      };

      setCurrentRequest(updatedRequest);
      void setVerificationRequests((prev) => ({
        ...prev,
        [petId]: updatedRequest,
      }));

      toast.success('Document uploaded!', {
        description: `${DOCUMENT_TYPE_LABELS[documentType]} has been uploaded successfully`,
      });
    } catch {
      toast.error('Upload failed', {
        description: 'Failed to upload document. Please try again.',
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!activeRequest) return;

    const doc = activeRequest.documents.find((d) => d.id === documentId);
    if (!doc) return;

    await VerificationService.deleteDocument(doc);

    const updatedRequest = {
      ...activeRequest,
      documents: activeRequest.documents.filter((d) => d.id !== documentId),
    };

    setCurrentRequest(updatedRequest);
    void setVerificationRequests((prev) => ({
      ...prev,
      [petId]: updatedRequest,
    }));

    toast.success('Document removed');
  };

  const handleSubmitForReview = () => {
    if (!activeRequest) return;

    if (completionPercentage < 100) {
      toast.error('Incomplete submission', {
        description: 'Please upload all required documents before submitting',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submittedRequest = VerificationService.submitForReview(activeRequest);

      setCurrentRequest(submittedRequest);
      void setVerificationRequests((prev) => ({
        ...prev,
        [petId]: submittedRequest,
      }));

      toast.success('Submitted for review!', {
        description: `Your verification request has been submitted. Expected review time: ${requirements.estimatedReviewTime}`,
      });
    } catch {
      toast.error('Submission failed', {
        description: 'Failed to submit verification request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateReview = (approve: boolean) => {
    if (activeRequest?.status !== 'pending') return;

    setIsSimulatingReview(true);

    try {
      const reviewedRequest = VerificationService.processReview(activeRequest, approve);

      setCurrentRequest(reviewedRequest);
      void setVerificationRequests((prev) => ({
        ...prev,
        [petId]: reviewedRequest,
      }));

      if (isTruthy(approve)) {
        toast.success('Verification approved! 🎉', {
          description: `Your pet has been verified with a trust score of ${reviewedRequest.trustScore}/100`,
        });
      } else {
        toast.error('Verification requires attention', {
          description: reviewedRequest.reviewNotes ?? 'Please review and resubmit documents',
        });
      }
    } finally {
      setIsSimulatingReview(false);
    }
  };

  const handleClose = () => {
    setCurrentRequest(null);
    onOpenChange(false);
  };

  const renderStatusBadge = () => {
    if (!activeRequest) return null;

    const statusConfig = {
      unverified: { icon: Info, label: 'Not Started', color: 'bg-muted text-muted-foreground' },
      pending: {
        icon: Clock,
        label: 'Under Review',
        color: 'bg-secondary text-secondary-foreground',
      },
      verified: {
        icon: CheckCircle,
        label: 'Verified',
        color: 'bg-primary text-primary-foreground',
      },
      rejected: {
        icon: XCircle,
        label: 'Needs Attention',
        color: 'bg-destructive text-destructive-foreground',
      },
      expired: { icon: Clock, label: 'Expired', color: 'bg-muted text-muted-foreground' },
    };

    const config = statusConfig[activeRequest.status];
    const Icon = config.icon;

    return (
      <Badge className={cn('gap-1.5', config.color)}>
        <Icon size={14} weight="bold" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MotionView
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="p-2 rounded-xl bg-linear-to-br from-primary/20 to-accent/20"
              >
                <ShieldCheck size={24} weight="fill" className="text-primary" />
              </MotionView>
              <div>
                <DialogTitle className="text-2xl">Pet Owner Verification</DialogTitle>
                <DialogDescription>
                  Verify your pet ownership to build trust and unlock premium features
                </DialogDescription>
              </div>
            </div>
            {renderStatusBadge()}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {!activeRequest && (
              <MotionView
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <VerificationLevelSelector
                  selectedLevel={selectedLevel}
                  onSelectLevel={setSelectedLevel}
                />

                <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Star size={18} weight="fill" className="text-accent" />
                    Benefits of {selectedLevel.charAt(0).toUpperCase() +
                      selectedLevel.slice(1)}{' '}
                    Verification
                  </h4>
                  <ul className="space-y-2">
                    {requirements.benefits.map((benefit, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle
                          size={16}
                          weight="fill"
                          className="text-primary mt-0.5 shrink-0"
                        />
                        <span>{benefit}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <Button onClick={handleStartVerification} className="w-full mt-6" size="lg">
                  <Certificate size={20} weight="bold" className="mr-2" />
                  Start Verification Process
                </Button>
              </MotionView>
            )}

            {activeRequest && (
              <MotionView initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="p-4 rounded-xl bg-linear-to-br from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground/80">
                      Verification Progress
                    </span>
                    <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {completionPercentage === 100
                      ? 'All required documents uploaded!'
                      : `${requirements.requiredDocuments.length - Math.ceil((completionPercentage / 100) * requirements.requiredDocuments.length)} required document(s) remaining`}
                  </p>
                </div>

                {activeRequest.status === 'verified' && activeRequest.trustScore && (
                  <MotionView
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 border border-primary/30"
                  >
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                        <CheckCircle size={32} weight="fill" className="text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Verification Complete!</h3>
                      <div className="flex items-center justify-center gap-2 text-4xl font-bold text-primary mb-2">
                        <TrendUp size={32} weight="bold" />
                        {activeRequest.trustScore}/100
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Trust Score</p>
                      {activeRequest.reviewNotes && (
                        <p className="text-sm text-foreground/80 bg-background/50 p-3 rounded-lg">
                          {activeRequest.reviewNotes}
                        </p>
                      )}
                    </div>
                  </MotionView>
                )}

                {activeRequest.status === 'rejected' && (
                  <MotionView
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 rounded-xl bg-destructive/10 border border-destructive/30"
                  >
                    <div className="flex items-start gap-3">
                      <XCircle
                        size={24}
                        weight="fill"
                        className="text-destructive shrink-0 mt-0.5"
                      />
                      <div>
                        <h4 className="font-semibold mb-1">Verification Requires Attention</h4>
                        <p className="text-sm text-muted-foreground">
                          {activeRequest.reviewNotes ??
                            'Some documents need to be reviewed and resubmitted.'}
                        </p>
                      </div>
                    </div>
                  </MotionView>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold">Required Documents</h4>
                  {requirements.requiredDocuments.map((docType) => {
                    const existingDoc = VerificationService.getDocumentByType(
                      activeRequest,
                      docType
                    );
                    return (
                      <DocumentUploadCard
                        key={docType}
                        documentType={docType}
                        label={DOCUMENT_TYPE_LABELS[docType]}
                        description={DOCUMENT_TYPE_DESCRIPTIONS[docType]}
                        {...(existingDoc && { existingDocument: existingDoc })}
                        onUpload={(file) => {
                          void handleDocumentUpload(file, docType);
                        }}
                        onDelete={(documentId) => {
                          void handleDeleteDocument(documentId);
                        }}
                        disabled={
                          activeRequest.status === 'verified' || activeRequest.status === 'pending'
                        }
                      />
                    );
                  })}
                </div>

                {requirements.optionalDocuments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-muted-foreground">Optional Documents</h4>
                    {requirements.optionalDocuments.map((docType) => {
                      const existingDoc = VerificationService.getDocumentByType(
                        activeRequest,
                        docType
                      );
                      return (
                        <DocumentUploadCard
                          key={docType}
                          documentType={docType}
                          label={DOCUMENT_TYPE_LABELS[docType]}
                          description={DOCUMENT_TYPE_DESCRIPTIONS[docType]}
                          {...(existingDoc && { existingDocument: existingDoc })}
                          onUpload={(file) => {
                            void handleDocumentUpload(file, docType);
                          }}
                          onDelete={(documentId) => {
                            void handleDeleteDocument(documentId);
                          }}
                          optional
                          disabled={
                            activeRequest.status === 'verified' ||
                            activeRequest.status === 'pending'
                          }
                        />
                      );
                    })}
                  </div>
                )}

                {activeRequest.status === 'unverified' && completionPercentage === 100 && (
                  <Button
                    onClick={handleSubmitForReview}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock size={20} weight="bold" className="mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <UploadSimple size={20} weight="bold" className="mr-2" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                )}

                {activeRequest.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSimulateReview(true)}
                      disabled={isSimulatingReview}
                      variant="primary"
                      className="flex-1"
                    >
                      <CheckCircle size={20} weight="bold" className="mr-2" />
                      Simulate Approval
                    </Button>
                    <Button
                      onClick={() => handleSimulateReview(false)}
                      disabled={isSimulatingReview}
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle size={20} weight="bold" className="mr-2" />
                      Simulate Rejection
                    </Button>
                  </div>
                )}
              </MotionView>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
