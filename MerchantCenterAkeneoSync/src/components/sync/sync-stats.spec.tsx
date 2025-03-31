import React from 'react';
import { render, screen } from '@testing-library/react';
import SyncStats from './sync-stats';

// Mock the UI components
jest.mock('@commercetools-uikit/card', () => {
  return function MockCard({ children }: { children: React.ReactNode }) {
    return <div data-testid="card">{children}</div>;
  };
});

jest.mock('@commercetools-uikit/grid', () => {
  const Grid = ({ children, gridGap, gridTemplateColumns }: any) => (
    <div
      data-testid="grid"
      data-grid-gap={gridGap}
      data-grid-template={gridTemplateColumns}
    >
      {children}
    </div>
  );
  Grid.Item = ({ children }: any) => (
    <div data-testid="grid-item">{children}</div>
  );
  return Grid;
});

jest.mock('@commercetools-uikit/spacings', () => {
  const Spacings = {
    Inline: ({ children, scale, alignItems }: any) => (
      <div
        data-testid="spacings-inline"
        data-scale={scale}
        data-align={alignItems}
      >
        {children}
      </div>
    ),
  };
  return Spacings;
});

jest.mock('@commercetools-uikit/text', () => {
  const Text = {
    Detail: ({ children, tone }: any) => (
      <span data-testid="text-detail" data-tone={tone}>
        {children}
      </span>
    ),
    Headline: ({ children, as }: any) => (
      <div data-testid="text-headline" data-as={as}>
        {children}
      </div>
    ),
  };
  return Text;
});

jest.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="icon-barchart">Chart Icon</div>,
  Clock: () => <div data-testid="icon-clock">Clock Icon</div>,
  Files: () => <div data-testid="icon-files">Files Icon</div>,
  RefreshCw: () => <div data-testid="icon-refresh">Refresh Icon</div>,
}));

describe('SyncStats', () => {
  it('renders the grid layout correctly', () => {
    render(<SyncStats />);

    const grid = screen.getByTestId('grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAttribute('data-grid-gap', '16px');
    expect(grid).toHaveAttribute('data-grid-template', 'repeat(4, 1fr)');
  });

  it('renders 4 grid items for the stats cards', () => {
    render(<SyncStats />);

    const gridItems = screen.getAllByTestId('grid-item');
    expect(gridItems).toHaveLength(4);
  });

  it('renders all 4 stats cards with correct data', () => {
    render(<SyncStats />);

    // 1. Total Syncs card
    expect(screen.getByTestId('icon-refresh')).toBeInTheDocument();
    expect(screen.getByText('Total Syncs')).toBeInTheDocument();
    expect(screen.getByText('1,284')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();

    // 2. Avg. Sync Time card
    expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
    expect(screen.getByText('Avg. Sync Time')).toBeInTheDocument();
    expect(screen.getByText('1.2m')).toBeInTheDocument();

    // 3. Items Synced card
    expect(screen.getByTestId('icon-files')).toBeInTheDocument();
    expect(screen.getByText('Items Synced')).toBeInTheDocument();
    expect(screen.getByText('842,245')).toBeInTheDocument();

    // 4. Success Rate card
    expect(screen.getByTestId('icon-barchart')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
  });

  it('renders the StatsCard component correctly', () => {
    render(<SyncStats />);

    // Check for the styling wrappers
    const spacings = screen.getAllByTestId('spacings-inline');
    expect(spacings.length).toBeGreaterThan(0);

    // Check for headline elements
    const headlines = screen.getAllByTestId('text-headline');
    expect(headlines).toHaveLength(4);

    // Check for detail elements (labels)
    const details = screen.getAllByTestId('text-detail');
    expect(details).toHaveLength(4);
  });
});
