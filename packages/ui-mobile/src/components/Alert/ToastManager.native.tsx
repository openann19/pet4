import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { Alert } from './Alert.native';
import type { AlertProps, ToastItem, ToastManager } from './Alert.types';

interface ToastContextValue extends ToastManager {
    readonly toasts: readonly ToastItem[];
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
    readonly children: React.ReactNode;
    readonly maxToasts?: number;
    readonly defaultPosition?: 'top' | 'bottom' | 'center';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
    children,
    maxToasts = 3,
    defaultPosition = 'top',
}) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastIdCounter = useRef(0);

    const show = useCallback((props: Omit<AlertProps, 'visible'>): string => {
        const id = `toast-${++toastIdCounter.current}`;
        const timestamp = Date.now();

        const newToast: ToastItem = {
            id,
            timestamp,
            position: defaultPosition,
            ...props,
        };

        setToasts(currentToasts => {
            const updatedToasts = [...currentToasts, newToast];
            // Remove oldest toasts if exceeding max limit
            return updatedToasts.slice(-maxToasts);
        });

        return id;
    }, [maxToasts, defaultPosition]);

    const hide = useCallback((id: string): void => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, []);

    const hideAll = useCallback((): void => {
        setToasts([]);
    }, []);

    const handleToastDismiss = useCallback((id: string) => {
        hide(id);
    }, [hide]);

    const contextValue: ToastContextValue = {
        toasts,
        show,
        hide,
        hideAll,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Render toasts by position */}
            {['top', 'bottom', 'center'].map(position => {
                const positionToasts = toasts.filter(toast => toast.position === position);

                if (positionToasts.length === 0) return null;

                return (
                    <View key={position}>
                        {positionToasts.map((toast, index) => (
                            <Alert
                                key={toast.id}
                                {...toast}
                                visible={true}
                                onDismiss={() => handleToastDismiss(toast.id)}
                                testID={`toast-${position}-${index}`}
                            />
                        ))}
                    </View>
                );
            })}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastManager => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return {
        show: context.show,
        hide: context.hide,
        hideAll: context.hideAll,
    };
};

// Convenience functions
export const toast = {
    success: (message: string, options?: Partial<AlertProps>) => {
        const context = useContext(ToastContext);
        return context?.show({ ...options, message, variant: 'success' }) ?? '';
    },

    error: (message: string, options?: Partial<AlertProps>) => {
        const context = useContext(ToastContext);
        return context?.show({ ...options, message, variant: 'error' }) ?? '';
    },

    warning: (message: string, options?: Partial<AlertProps>) => {
        const context = useContext(ToastContext);
        return context?.show({ ...options, message, variant: 'warning' }) ?? '';
    },

    info: (message: string, options?: Partial<AlertProps>) => {
        const context = useContext(ToastContext);
        return context?.show({ ...options, message, variant: 'info' }) ?? '';
    },
};
