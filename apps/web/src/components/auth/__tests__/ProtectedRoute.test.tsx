/**
 * ProtectedRoute tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Mock dependencies
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/protected', state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock('@/lib/kyc-service', () => ({
  getKYCStatus: vi.fn(),
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: ({ size }: { size?: string | number }) => <div data-testid={`spinner-${size}`}>Loading...</div>,
}));

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', roles: ['user'] },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(document.querySelector('[data-testid="protected-content"]')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      '/login',
      expect.objectContaining({
        state: { returnTo: '/protected' },
        replace: true,
      })
    );
  });

  it('should show spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(getByTestId('spinner-lg')).toBeInTheDocument();
  });

  it('should redirect to unauthorized when adminOnly and user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', roles: ['user'] },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <TestWrapper>
        <ProtectedRoute adminOnly>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/unauthorized', { replace: true });
  });

  it('should allow access when adminOnly and user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1', roles: ['admin'] },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <TestWrapper>
        <ProtectedRoute adminOnly>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(document.querySelector('[data-testid="protected-content"]')).toBeInTheDocument();
  });

  it('should redirect to unauthorized when moderatorOnly and user is not moderator', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', roles: ['user'] },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute moderatorOnly>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/unauthorized', { replace: true });
  });

  it('should allow access when moderatorOnly and user is moderator', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'mod-1', roles: ['moderator'] },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute moderatorOnly>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(document.querySelector('[data-testid="protected-content"]')).toBeInTheDocument();
  });

  it('should allow access when moderatorOnly and user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1', roles: ['admin'] },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute moderatorOnly>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(document.querySelector('[data-testid="protected-content"]')).toBeInTheDocument();
  });
});

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
