/**
 * Render Helpers
 *
 * Custom render functions with providers for testing
 */

import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { UIProvider } from '@/contexts/UIContext';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Create a test query client with default options
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Note: AppContext and AuthContext are not directly mockable since they use hooks internally.
 * Instead, we'll use the actual providers and mock the underlying dependencies.
 * For testing, components should be tested with the actual providers when possible.
 */

interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  initialEntries?: string[];
  skipRouter?: boolean;
}

/**
 * AllProviders component that wraps children with all necessary providers
 * Note: AppProvider and AuthProvider use hooks internally, so we use the actual providers
 */
function AllProviders({ children, queryClient, skipRouter = false }: AllProvidersProps) {
  const client = queryClient ?? createTestQueryClient();

  const content = (
    <QueryClientProvider client={client}>
      <AppProvider>
        <AuthProvider>
          <UIProvider>{children}</UIProvider>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );

  if (skipRouter) {
    return content;
  }

  return (
    <BrowserRouter>
      {content}
    </BrowserRouter>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
  skipRouter?: boolean;
}

/**
 * Render component with all providers
 * Note: For mocking context values, mock the underlying hooks/dependencies instead
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> {
  const { queryClient, initialEntries, skipRouter, ...renderOptions } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AllProviders queryClient={queryClient} initialEntries={initialEntries} skipRouter={skipRouter}>
        {children}
      </AllProviders>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render component with React Query provider and App provider
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
): ReturnType<typeof render> {
  const { queryClient, ...renderOptions } = options ?? {};
  const client = queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={client}>
          <AppProvider>
            <UIProvider>{children}</UIProvider>
          </AppProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render component with Router only
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[] }
): ReturnType<typeof render> {
  const { initialEntries: _initialEntries = ['/'], ...renderOptions } = options ?? {};

  function Wrapper({ children }: { children: ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render component with UIProvider and AppProvider only
 */
export function renderWithUI(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProvider>
        <UIProvider>{children}</UIProvider>
      </AppProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
