import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CostPanel from '../CostPanel';

// Mock Zustand store
vi.mock('../../store/useStore', () => ({
  default: vi.fn(() => ({
    nodes: [],
    region: 'us-east-1',
    pricingModel: 'on-demand',
  })),
}));

// Mock child components
vi.mock('../CostAnalytics', () => ({
  default: () => <div>Cost Analytics</div>,
}));

vi.mock('../OptimizationPanel', () => ({
  default: () => <div>Optimization Panel</div>,
}));

describe('CostPanel Component', () => {
  it('should render cost panel header', () => {
    render(<CostPanel />);
    
    expect(screen.getByText('💰 Cost Estimate')).toBeInTheDocument();
  });

  it('should display region', () => {
    render(<CostPanel />);
    
    expect(screen.getByText(/Region: us-east-1/i)).toBeInTheDocument();
  });

  it('should render tab buttons', () => {
    render(<CostPanel />);
    
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Optimization/i)).toBeInTheDocument();
  });

  it('should show empty state when no nodes', () => {
    render(<CostPanel />);
    
    expect(screen.getByText(/Drag AWS services onto the canvas/i)).toBeInTheDocument();
  });
});
