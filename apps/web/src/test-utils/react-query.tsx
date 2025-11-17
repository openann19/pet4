import React, { type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    renderHook,
    type RenderHookOptions,
    type RenderHookResult,
} from '@testing-library/react';

export interface RenderHookWithQueryClientOptions<Props>
    extends Omit<RenderHookOptions<Props>, 'wrapper'> {
    readonly client?: QueryClient;
}

export interface RenderHookWithQueryClientResult<Result, Props>
    extends RenderHookResult<Result, Props> {
    readonly client: QueryClient;
}

export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

export function withQueryClient(
    client: QueryClient
): React.ComponentType<PropsWithChildren> {
    return function QueryClientWrapper({ children }: PropsWithChildren): JSX.Element {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };
}

export function renderHookWithQueryClient<Result, Props>(
    callback: (initialProps: Props) => Result,
    options: RenderHookWithQueryClientOptions<Props> = {}
): RenderHookWithQueryClientResult<Result, Props> {
    const { client: providedClient, ...restOptions } = options;
    const client = providedClient ?? createTestQueryClient();
    const wrapper = withQueryClient(client);

    const renderResult = renderHook(callback, {
        wrapper,
        ...restOptions,
    });

    return {
        ...renderResult,
        client,
    };
}
