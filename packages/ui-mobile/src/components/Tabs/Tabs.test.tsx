import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Tabs } from './Tabs.native';
import type { TabItem } from './Tabs.types';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
}));

// Mock useReducedMotion
jest.mock('../../hooks/useReducedMotion', () => ({
    useReducedMotion: jest.fn(() => false),
}));

const mockItems: TabItem[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'profile', label: 'Profile', icon: '👤', badge: 3 },
    { id: 'settings', label: 'Settings', icon: '⚙️', disabled: true },
];

describe('Tabs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with basic props', () => {
        render(<Tabs items={mockItems} testID="tabs" />);

        expect(screen.getByTestId('tabs')).toBeTruthy();
        expect(screen.getByText('Home')).toBeTruthy();
        expect(screen.getByText('Search')).toBeTruthy();
        expect(screen.getByText('Profile')).toBeTruthy();
        expect(screen.getByText('Settings')).toBeTruthy();
    });

    it('displays icons when showIcons is true', () => {
        render(<Tabs items={mockItems} showIcons={true} testID="tabs" />);

        expect(screen.getByText('🏠')).toBeTruthy();
        expect(screen.getByText('🔍')).toBeTruthy();
        expect(screen.getByText('👤')).toBeTruthy();
        expect(screen.getByText('⚙️')).toBeTruthy();
    });

    it('hides labels when showLabels is false', () => {
        render(<Tabs items={mockItems} showLabels={false} testID="tabs" />);

        expect(screen.queryByText('Home')).toBeNull();
        expect(screen.queryByText('Search')).toBeNull();
        expect(screen.queryByText('Profile')).toBeNull();
        expect(screen.queryByText('Settings')).toBeNull();
    });

    it('displays badges correctly', () => {
        render(<Tabs items={mockItems} testID="tabs" />);

        expect(screen.getByText('3')).toBeTruthy();
    });

    it('handles tab selection', () => {
        const onValueChange = jest.fn();
        render(
            <Tabs
                items={mockItems}
                value="home"
                onValueChange={onValueChange}
                testID="tabs"
            />
        );

        const searchTab = screen.getByTestId('tabs-tab-search');
        fireEvent.press(searchTab);

        expect(onValueChange).toHaveBeenCalledWith('search');
    });

    it('prevents selection of disabled tabs', () => {
        const onValueChange = jest.fn();
        render(
            <Tabs
                items={mockItems}
                onValueChange={onValueChange}
                testID="tabs"
            />
        );

        const settingsTab = screen.getByTestId('tabs-tab-settings');
        fireEvent.press(settingsTab);

        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('applies correct accessibility attributes', () => {
        render(<Tabs items={mockItems} value="home" testID="tabs" />);

        const homeTab = screen.getByTestId('tabs-tab-home');
        const searchTab = screen.getByTestId('tabs-tab-search');
        const settingsTab = screen.getByTestId('tabs-tab-settings');

        expect(homeTab).toHaveProp('accessibilityRole', 'tab');
        expect(homeTab).toHaveProp('accessibilityState', { selected: true, disabled: false });
        expect(searchTab).toHaveProp('accessibilityState', { selected: false, disabled: false });
        expect(settingsTab).toHaveProp('accessibilityState', { selected: false, disabled: true });
    });

    it('handles different variants correctly', () => {
        const { rerender } = render(
            <Tabs items={mockItems} variant="primary" testID="tabs" />
        );
        expect(screen.getByTestId('tabs')).toBeTruthy();

        rerender(<Tabs items={mockItems} variant="secondary" testID="tabs" />);
        expect(screen.getByTestId('tabs')).toBeTruthy();

        rerender(<Tabs items={mockItems} variant="ghost" testID="tabs" />);
        expect(screen.getByTestId('tabs')).toBeTruthy();
    });

    it('handles different sizes correctly', () => {
        const { rerender } = render(
            <Tabs items={mockItems} size="sm" testID="tabs" />
        );
        expect(screen.getByTestId('tabs')).toBeTruthy();

        rerender(<Tabs items={mockItems} size="md" testID="tabs" />);
        expect(screen.getByTestId('tabs')).toBeTruthy();

        rerender(<Tabs items={mockItems} size="lg" testID="tabs" />);
        expect(screen.getByTestId('tabs')).toBeTruthy();
    });

    it('handles position variants correctly', () => {
        const { rerender } = render(
            <Tabs items={mockItems} position="top" testID="tabs" />
        );
        expect(screen.getByTestId('tabs')).toBeTruthy();

        rerender(<Tabs items={mockItems} position="bottom" testID="tabs" />);
        expect(screen.getByTestId('tabs')).toBeTruthy();
    });

    it('respects disabled prop', () => {
        const onValueChange = jest.fn();
        render(
            <Tabs
                items={mockItems}
                disabled={true}
                onValueChange={onValueChange}
                testID="tabs"
            />
        );

        const homeTab = screen.getByTestId('tabs-tab-home');
        fireEvent.press(homeTab);

        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('handles large badge numbers correctly', () => {
        const itemsWithLargeBadge: TabItem[] = [
            { id: 'notifications', label: 'Notifications', badge: 150 },
        ];

        render(<Tabs items={itemsWithLargeBadge} testID="tabs" />);

        expect(screen.getByText('99+')).toBeTruthy();
    });

    it('applies custom styles correctly', () => {
        const customStyle = { backgroundColor: 'red' };
        const customTabStyle = { padding: 20 };
        const customLabelStyle = { color: 'blue' };

        render(
            <Tabs
                items={mockItems}
                style={customStyle}
                tabStyle={customTabStyle}
                labelStyle={customLabelStyle}
                testID="tabs"
            />
        );

        expect(screen.getByTestId('tabs')).toHaveStyle(customStyle);
    });

    it('handles scrollable tabs', () => {
        render(<Tabs items={mockItems} scrollable={true} testID="tabs" />);

        expect(screen.getByTestId('tabs')).toBeTruthy();
        // In scrollable mode, tabs should still render correctly
        expect(screen.getByText('Home')).toBeTruthy();
    });
});
