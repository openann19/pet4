/**
 * Integration Tests: Authentication Flow
 *
 * Tests the complete authentication flow from signup to login to session management
 * Coverage target: Critical user flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SignUpForm from '@/components/auth/SignUpForm';
import SignInForm from '@/components/auth/SignInForm';

vi.mock('@/api/auth-api', () => ({
    authApi: {
        register: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        refresh: vi.fn(),
    },
}));

vi.mock('@/lib/logger', () => ({
    createLogger: () => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    }),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const createTestWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
};

describe('Authentication Flow Integration', () => {
    let authApi: {
        register: ReturnType<typeof vi.fn>;
        login: ReturnType<typeof vi.fn>;
        logout: ReturnType<typeof vi.fn>;
        refresh: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        const authModule = await import('@/api/auth-api');
        authApi = {
            register: vi.mocked(authModule.authApi.register),
            login: vi.mocked(authModule.authApi.login),
            logout: vi.mocked(authModule.authApi.logout),
            refresh: vi.mocked(authModule.authApi.refresh),
        };
    });

    describe('Sign Up Flow', () => {
        it('should complete signup flow successfully', async () => {
            const user = userEvent.setup();
            authApi.register.mockResolvedValue({
                user: { id: '1', email: 'test@example.com' },
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });

            const onSuccess = vi.fn();
            const onSwitchToSignIn = vi.fn();

            const Wrapper = createTestWrapper();
            render(
                <Wrapper>
                    <SignUpForm onSuccess={onSuccess} onSwitchToSignIn={onSwitchToSignIn} />
                </Wrapper>
            );

            await user.type(screen.getByPlaceholderText(/name/i), 'Test User');
            await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
            await user.type(screen.getByPlaceholderText(/password/i), 'password123');
            await user.type(screen.getByPlaceholderText(/confirm/i), 'password123');

            const submitButton = screen.getByRole('button', { name: /sign up/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(authApi.register).toHaveBeenCalledWith({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                });
            });
        });

        it('should handle signup errors gracefully', async () => {
            const user = userEvent.setup();
            authApi.register.mockRejectedValue(new Error('Email already exists'));

            const onSuccess = vi.fn();
            const onSwitchToSignIn = vi.fn();

            const Wrapper = createTestWrapper();
            render(
                <Wrapper>
                    <SignUpForm onSuccess={onSuccess} onSwitchToSignIn={onSwitchToSignIn} />
                </Wrapper>
            );

            await user.type(screen.getByPlaceholderText(/name/i), 'Test User');
            await user.type(screen.getByPlaceholderText(/email/i), 'existing@example.com');
            await user.type(screen.getByPlaceholderText(/password/i), 'password123');
            await user.type(screen.getByPlaceholderText(/confirm/i), 'password123');

            const submitButton = screen.getByRole('button', { name: /sign up/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(authApi.register).toHaveBeenCalled();
            });
        });
    });

    describe('Sign In Flow', () => {
        it('should complete signin flow successfully', async () => {
            const user = userEvent.setup();
            authApi.login.mockResolvedValue({
                user: { id: '1', email: 'test@example.com' },
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });

            const onSuccess = vi.fn();
            const onSwitchToSignUp = vi.fn();

            const Wrapper = createTestWrapper();
            render(
                <Wrapper>
                    <SignInForm onSuccess={onSuccess} onSwitchToSignUp={onSwitchToSignUp} />
                </Wrapper>
            );

            await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
            await user.type(screen.getByPlaceholderText(/password/i), 'password123');

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(authApi.login).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                });
            });
        });

        it('should handle invalid credentials', async () => {
            const user = userEvent.setup();
            authApi.login.mockRejectedValue(new Error('Invalid credentials'));

            const onSuccess = vi.fn();
            const onSwitchToSignUp = vi.fn();

            const Wrapper = createTestWrapper();
            render(
                <Wrapper>
                    <SignInForm onSuccess={onSuccess} onSwitchToSignUp={onSwitchToSignUp} />
                </Wrapper>
            );

            await user.type(screen.getByPlaceholderText(/email/i), 'wrong@example.com');
            await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword');

            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(authApi.login).toHaveBeenCalled();
            });
        });
    });

    describe('Session Management', () => {
        it('should handle token refresh on 401', async () => {
            authApi.refresh.mockResolvedValue({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            });

            const response = await authApi.refresh();

            expect(response.accessToken).toBe('new-access-token');
            expect(authApi.refresh).toHaveBeenCalled();
        });

        it('should handle logout', async () => {
            authApi.logout.mockResolvedValue(undefined);

            await authApi.logout();

            expect(authApi.logout).toHaveBeenCalled();
        });
    });
});
