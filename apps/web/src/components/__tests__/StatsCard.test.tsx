/**
 * StatsCard component tests
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatsCard from '../StatsCard';

// Mock AppContext
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      profile: {
        stats: 'Stats',
        totalMatches: 'Total Matches',
        totalSwipes: 'Total Swipes',
        successRate: 'Success Rate',
      },
    },
  }),
}));

describe('StatsCard', () => {
  it('should render stats values', () => {
    render(<StatsCard totalMatches={10} totalSwipes={50} successRate={20} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText(/20%/)).toBeInTheDocument();
  });

  it('should display stat labels', () => {
    render(<StatsCard totalMatches={5} totalSwipes={25} successRate={15} />);
    
    expect(screen.getByText('Total Matches')).toBeInTheDocument();
    expect(screen.getByText('Total Swipes')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('should round numbers', () => {
    render(<StatsCard totalMatches={10.7} totalSwipes={50.3} successRate={20.9} />);
    
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText(/21%/)).toBeInTheDocument();
  });

  it('should handle zero values', () => {
    render(<StatsCard totalMatches={0} totalSwipes={0} successRate={0} />);
    
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });
});
