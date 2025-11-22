import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import APIConfigView from './APIConfigView';
import { useAPIConfig } from '@/hooks/admin/use-api-config';
import type { APIConfig } from '@/api/api-config-api';
import type { User } from '@/lib/user-service';

vi.mock('@/hooks/admin/use-api-config');
vi.mock('@/hooks/use-storage', () => ({
    useStorage: vi.fn(() => [null, vi.fn()]),
}));
vi.mock('@/effects/reanimated/use-hover-lift', () => ({
    useHoverLift: vi.fn(() => ({
        animatedStyle: {},
        handleEnter: vi.fn(),
        handleLeave: vi.fn(),
    })),
}));
vi.mock('@/effects/reanimated/animated-view', () => ({
    AnimatedView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

const mockUser: User = {
    id: 'user-1',
    login: 'admin',
    avatarUrl: null,
    email: 'admin@test.com',
    displayName: 'Test Admin',
};

const mockConfig: APIConfig = {
    maps: {
        provider: 'openstreetmap',
        apiKey: '',
        enabled: true,
        rateLimit: 100,
    },
    ai: {
        provider: 'spark',
        apiKey: '',
        model: 'gpt-4o',
        enabled: true,
        maxTokens: 1000,
        temperature: 0.7,
    },
    kyc: {
        provider: 'manual',
        apiKey: '',
        enabled: true,
        autoApprove: false,
        requireDocuments: true,
    },
    photoModeration: {
        provider: 'spark',
        apiKey: '',
        enabled: true,
        autoReject: false,
        confidenceThreshold: 0.8,
    },
    sms: {
        provider: 'disabled',
        apiKey: '',
        apiSecret: '',
        enabled: false,
        fromNumber: '',
    },
    email: {
        provider: 'disabled',
        apiKey: '',
        enabled: false,
        fromEmail: '',
        fromName: 'PawfectMatch',
    },
    storage: {
        provider: 'local',
        apiKey: '',
        apiSecret: '',
        bucket: '',
        region: 'us-east-1',
        enabled: true,
    },
    analytics: {
        provider: 'disabled',
        apiKey: '',
        enabled: false,
    },
    livekit: {
        apiKey: '',
        apiSecret: '',
        wsUrl: '',
        enabled: false,
    },
};

const mockUseAPIConfig = vi.mocked(useAPIConfig);

describe('APIConfigView', () => {
    const mockUpdateConfig = vi.fn();
    const mockToggleSecret = vi.fn();
    const mockTestConnection = vi.fn();
    const mockResetToDefaults = vi.fn();
    const mockHandleBroadcast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAPIConfig.mockReturnValue({
            config: mockConfig,
            loading: false,
            saving: false,
            showSecrets: {},
            testingService: null,
            broadcasting: false,
            loadConfig: vi.fn(),
            saveConfig: vi.fn(),
            updateConfig: mockUpdateConfig,
            toggleSecret: mockToggleSecret,
            testConnection: mockTestConnection,
            resetToDefaults: mockResetToDefaults,
            handleBroadcast: mockHandleBroadcast,
        });
    });

    it('renders the component with header and security notice', () => {
        render(<APIConfigView />);

        expect(screen.getByText('API Configuration')).toBeInTheDocument();
        expect(screen.getByText(/Configure external service integrations/i)).toBeInTheDocument();
        expect(screen.getByText('Security Notice')).toBeInTheDocument();
        expect(screen.getByText(/API keys and secrets are stored securely/i)).toBeInTheDocument();
    });

    it('renders all tabs with icons', () => {
        render(<APIConfigView />);

        expect(screen.getByRole('tab', { name: /maps/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /ai/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /kyc/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /moderation/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /sms/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /email/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /storage/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /livekit/i })).toBeInTheDocument();
    });

    it('uses Select components instead of native select elements', async () => {
        render(<APIConfigView />);

        const mapsTab = screen.getByRole('tab', { name: /maps/i });
        await userEvent.click(mapsTab);

        const providerLabel = screen.getByLabelText('Provider');
        expect(providerLabel).toBeInTheDocument();

        const selectTrigger = providerLabel.closest('div')?.querySelector('[data-slot="select-trigger"]');
        expect(selectTrigger).toBeInTheDocument();
    });

    it('allows selecting different providers using Select component', async () => {
        render(<APIConfigView />);

        const mapsTab = screen.getByRole('tab', { name: /maps/i });
        await userEvent.click(mapsTab);

        const providerSelect = screen.getByLabelText('Provider');
        const selectButton = providerSelect.closest('div')?.querySelector('button[data-slot="select-trigger"]');

        if (selectButton) {
            await userEvent.click(selectButton);

            await waitFor(() => {
                expect(screen.getByText('Google Maps')).toBeInTheDocument();
                expect(screen.getByText('Mapbox')).toBeInTheDocument();
                expect(screen.getByText('OpenStreetMap (Free)')).toBeInTheDocument();
            });

            const googleMapsOption = screen.getByText('Google Maps');
            await userEvent.click(googleMapsOption);

            await waitFor(() => {
                expect(mockUpdateConfig).toHaveBeenCalledWith('maps', 'provider', 'google');
            });
        }
    });

    it('displays Alert component for security notice', () => {
        render(<APIConfigView />);

        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveClass('shadow-sm');
    });

    it('displays Alert component for LiveKit warning', async () => {
        render(<APIConfigView />);

        const livekitTab = screen.getByRole('tab', { name: /livekit/i });
        await userEvent.click(livekitTab);

        await waitFor(() => {
            expect(screen.getByText('Server-Side Implementation Required')).toBeInTheDocument();
        });
    });

    it('handles test connection button clicks', async () => {
        render(<APIConfigView />);

        const mapsTab = screen.getByRole('tab', { name: /maps/i });
        await userEvent.click(mapsTab);

        const testButton = screen.getByRole('button', { name: /test connection/i });
        await userEvent.click(testButton);

        await waitFor(() => {
            expect(mockTestConnection).toHaveBeenCalledWith('Maps');
        });
    });

    it('handles reset to defaults button clicks', async () => {
        render(<APIConfigView />);

        const mapsTab = screen.getByRole('tab', { name: /maps/i });
        await userEvent.click(mapsTab);

        const resetButton = screen.getByRole('button', { name: /^reset$/i });
        await userEvent.click(resetButton);

        expect(mockResetToDefaults).toHaveBeenCalledWith('maps');
    });

    it('handles broadcast config button clicks', async () => {
        render(<APIConfigView />);

        const broadcastButton = screen.getByRole('button', { name: /broadcast config/i });
        await userEvent.click(broadcastButton);

        await waitFor(() => {
            expect(mockHandleBroadcast).toHaveBeenCalled();
        });
    });

    it('toggles secret visibility', async () => {
        mockUseAPIConfig.mockReturnValue({
            config: { ...mockConfig, ai: { ...mockConfig.ai, apiKey: 'test-key' } },
            loading: false,
            saving: false,
            showSecrets: { 'ai-key': false },
            testingService: null,
            broadcasting: false,
            loadConfig: vi.fn(),
            saveConfig: vi.fn(),
            updateConfig: mockUpdateConfig,
            toggleSecret: mockToggleSecret,
            testConnection: mockTestConnection,
            resetToDefaults: mockResetToDefaults,
            handleBroadcast: mockHandleBroadcast,
        });

        render(<APIConfigView />);

        const aiTab = screen.getByRole('tab', { name: /ai/i });
        await userEvent.click(aiTab);

        const toggleButton = screen.getByRole('button', { name: /show ai api key/i });
        await userEvent.click(toggleButton);

        expect(mockToggleSecret).toHaveBeenCalledWith('ai-key');
    });

    it('shows loading state when testing connection', () => {
        mockUseAPIConfig.mockReturnValue({
            config: mockConfig,
            loading: false,
            saving: false,
            showSecrets: {},
            testingService: 'Maps',
            broadcasting: false,
            loadConfig: vi.fn(),
            saveConfig: vi.fn(),
            updateConfig: mockUpdateConfig,
            toggleSecret: mockToggleSecret,
            testConnection: mockTestConnection,
            resetToDefaults: mockResetToDefaults,
            handleBroadcast: mockHandleBroadcast,
        });

        render(<APIConfigView />);

        const testButton = screen.getByRole('button', { name: /testing/i });
        expect(testButton).toBeDisabled();
    });

    it('shows broadcasting state when broadcasting', () => {
        mockUseAPIConfig.mockReturnValue({
            config: mockConfig,
            loading: false,
            saving: false,
            showSecrets: {},
            testingService: null,
            broadcasting: true,
            loadConfig: vi.fn(),
            saveConfig: vi.fn(),
            updateConfig: mockUpdateConfig,
            toggleSecret: mockToggleSecret,
            testConnection: mockTestConnection,
            resetToDefaults: mockResetToDefaults,
            handleBroadcast: mockHandleBroadcast,
        });

        render(<APIConfigView />);

        expect(screen.getByRole('button', { name: /broadcasting/i })).toBeInTheDocument();
    });

    it('renders all service cards with proper structure', async () => {
        render(<APIConfigView />);

        const tabs = ['maps', 'ai', 'kyc', 'moderation', 'sms', 'email', 'storage', 'analytics', 'livekit'];

        for (const tab of tabs) {
            const tabElement = screen.getByRole('tab', { name: new RegExp(tab, 'i') });
            await userEvent.click(tabElement);

            await waitFor(() => {
                const cardTitle = screen.getByRole('heading', { level: 3 });
                expect(cardTitle).toBeInTheDocument();
            });
        }
    });

    it('conditionally shows API key fields based on provider selection', async () => {
        render(<APIConfigView />);

        const mapsTab = screen.getByRole('tab', { name: /maps/i });
        await userEvent.click(mapsTab);

        const providerSelect = screen.getByLabelText('Provider');
        const selectButton = providerSelect.closest('div')?.querySelector('button[data-slot="select-trigger"]');

        if (selectButton) {
            await userEvent.click(selectButton);

            await waitFor(() => {
                expect(screen.getByText('Google Maps')).toBeInTheDocument();
            });

            const googleMapsOption = screen.getByText('Google Maps');
            await userEvent.click(googleMapsOption);

            await waitFor(() => {
                expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
            });
        }
    });

    it('has proper accessibility attributes', () => {
        render(<APIConfigView />);

        const securityAlert = screen.getByRole('alert');
        expect(securityAlert).toBeInTheDocument();

        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThan(0);

        tabs.forEach((tab) => {
            expect(tab).toHaveAttribute('aria-selected');
        });
    });

    it('renders with proper spacing and visual hierarchy', () => {
        const { container } = render(<APIConfigView />);

        const header = container.querySelector('h1');
        expect(header).toHaveClass('text-3xl', 'font-bold');

        const cards = container.querySelectorAll('[data-slot="card"]');
        expect(cards.length).toBeGreaterThan(0);
    });
});
