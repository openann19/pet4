/**
 * Data Deletion Component
 *
 * Allows users to delete their account and all associated data (GDPR Right to Erasure).
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { gdprApi } from '@/api/gdpr-api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DataDeletion');

interface DataDeletionProps {
    userId: string;
    onDeletionComplete?: () => void;
}

export function DataDeletion({ userId, onDeletionComplete }: DataDeletionProps): React.JSX.Element {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deletionError, setDeletionError] = useState<string | null>(null);
    const [deletionSuccess, setDeletionSuccess] = useState(false);

    const CONFIRMATION_TEXT = 'DELETE';

    // Handle deletion confirmation
    const handleDelete = async (): Promise<void> => {
        if (confirmText !== CONFIRMATION_TEXT) {
            setDeletionError('Please type DELETE to confirm');
            return;
        }

        try {
            setIsDeleting(true);
            setDeletionError(null);
            setDeletionSuccess(false);

            const result = await gdprApi.deleteUserData({
                userId,
                confirmDeletion: true,
                reason: 'User requested account deletion',
            });

            if (result.success) {
                setDeletionSuccess(true);
                setShowConfirmDialog(false);
                onDeletionComplete?.();

                // Redirect to home page after 3 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                setDeletionError(
                    `Deletion completed with errors: ${result.errors.map((errorItem) => errorItem.error).join(', ')}`
                );
            }
        } catch (_error) {
            const err = _error instanceof Error ? _error : new Error(String(_error));
            logger.error('Failed to delete user data', err, { userId });
            setDeletionError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Delete Account</CardTitle>
                    <CardDescription>
                        Permanently delete your account and all associated data (GDPR Right to Erasure).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-4 font-semibold text-destructive">
                            Warning: This action cannot be undone!
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Deleting your account will permanently remove:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
                            <li>Your user profile and account information</li>
                            <li>All pet profiles you created</li>
                            <li>All matches and swipe history</li>
                            <li>All chat messages and conversations</li>
                            <li>All community posts and comments</li>
                            <li>All payment and transaction history</li>
                            <li>All verification data</li>
                            <li>All preferences and settings</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mb-4">
                            This action is irreversible. Please make sure you want to delete your account before proceeding.
                        </p>
                    </div>

                    {deletionError && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">Error: {deletionError}</p>
                        </div>
                    )}

                    {deletionSuccess && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-sm text-green-600">
                                Your account has been deleted successfully. You will be redirected to the home page shortly.
                            </p>
                        </div>
                    )}

                    <Button
                        variant="destructive"
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={isDeleting || deletionSuccess}
                        className="w-full"
                    >
                        Delete My Account
                    </Button>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Account Deletion</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your account and all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            To confirm, please type <span className="font-mono font-bold">DELETE</span> in the box below:
                        </p>
                        <Input
                            type="text"
                            value={confirmText}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="font-mono"
                            aria-label="Confirmation text input"
                        />
                        {deletionError && (
                            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded">
                                <p className="text-sm text-destructive">{deletionError}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void handleDelete()}
                            disabled={isDeleting || confirmText !== CONFIRMATION_TEXT}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
