'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        __NAV_ERRORS__?: {
            kind: string;
            t: number;
            message?: string;
            stack?: string;
            src?: string;
            note?: string;
            reason?: string;
        }[];
    }
}

export default function GlobalNavErrorTrap(): null {
    useEffect(() => {
        window.__NAV_ERRORS__ ??= [];

        const push = (kind: string, payload: Record<string, unknown>): void => {
            window.__NAV_ERRORS__!.push({
                kind,
                t: Date.now(),
                ...payload,
            });
        };

        const onError = (e: ErrorEvent): void => {
            push('error', {
                message: e.message,
                stack: e.error instanceof Error ? e.error.stack : undefined,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
            });
        };

        const onRejection = (e: PromiseRejectionEvent): void => {
            const reason = e.reason instanceof Error ? e.reason.message : String(e.reason ?? '');
            const stack = e.reason instanceof Error ? e.reason.stack : undefined;

            push('unhandledrejection', {
                reason,
                stack,
            });

            const msg = reason;
            if (/Loading chunk [\s\S]* failed|ChunkLoadError/.test(msg)) {
                const hasReloaded = sessionStorage.getItem('__chunk_reload_attempted') === 'true';
                if (!hasReloaded) {
                    sessionStorage.setItem('__chunk_reload_attempted', 'true');
                    window.location.reload();
                }
            }
        };

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);

        const origAppend = document.head.appendChild.bind(document.head);
        document.head.appendChild = function <T extends Node>(el: T): T {
            if (el && 'tagName' in el && el.tagName === 'SCRIPT') {
                const scriptEl = el as unknown as HTMLScriptElement;
                scriptEl.addEventListener?.('error', () => {
                    push('chunkload', {
                        src: scriptEl.src,
                        note: 'Loading chunk failed',
                    });
                });
            }
            return origAppend(el);
        };

        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
            document.head.appendChild = origAppend;
        };
    }, []);

    return null;
}
