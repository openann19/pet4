import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { AppProvider } from '@/contexts/AppContext'

// Create a test-specific QueryClient
const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            gcTime: 0,
        },
        mutations: {
            retry: false,
        },
    },
})

interface TestWrapperProps {
    children: React.ReactNode
    queryClient?: QueryClient
}

// Test wrapper with all necessary providers
const TestWrapper: React.FC<TestWrapperProps> = ({
    children,
    queryClient = createTestQueryClient()
}) => {
    return (
        <QueryClientProvider client={queryClient}>
            <MotionConfig transition={{ duration: 0 }}>
                <AppProvider>
                    {children}
                </AppProvider>
            </MotionConfig>
        </QueryClientProvider>
    )
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    queryClient?: QueryClient
}

const customRender = (
    ui: React.ReactElement,
    { queryClient, ...renderOptions }: CustomRenderOptions = {}
) => {
    const client = queryClient || createTestQueryClient()

    return render(ui, {
        wrapper: ({ children }) => (
            <TestWrapper queryClient={client}>
                {children}
            </TestWrapper>
        ),
        ...renderOptions,
    })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }
export { TestWrapper }
export { createTestQueryClient }
