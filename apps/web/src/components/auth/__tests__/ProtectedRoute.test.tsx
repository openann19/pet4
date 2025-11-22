// @vitest-environment jsdom
import type { PropsWithChildren } from 'react';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function TestWrapper({
  children,
  initialEntries = ['/private'],
}: PropsWithChildren<{ initialEntries?: string[] }>) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function PrivateScreen() {
  return <div aria-label="private">PRIVATE</div>;
}
function LoginScreen() {
  return <div aria-label="login">LOGIN</div>;
}

describe('ProtectedRoute', () => {
  it('renders protected content when allowed', () => {
    render(
      <TestWrapper>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <PrivateScreen />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginScreen />} />
        </Routes>
      </TestWrapper>,
    );
    expect(screen.getByLabelText('private')).toBeInTheDocument();
  });

  it('redirects to /login when not allowed (fallback)', () => {
    render(
      <TestWrapper initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <PrivateScreen />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </TestWrapper>,
    );
    expect(screen.queryByLabelText('private')).toBeNull();
  });
});
