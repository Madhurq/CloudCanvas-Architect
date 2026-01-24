import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServicePalette from '../ServicePalette';

// Mock Zustand store
vi.mock('../../store/useStore', () => ({
  default: vi.fn(() => ({
    addNode: vi.fn(),
  })),
}));

describe('ServicePalette Component', () => {
  it('should render service categories', () => {
    render(<ServicePalette />);
    
    expect(screen.getByText('AWS Services')).toBeInTheDocument();
  });

  it('should display search input', () => {
    render(<ServicePalette />);
    
    const searchInput = screen.getByPlaceholderText(/search services/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should render service items', () => {
    render(<ServicePalette />);
    
    // Check for some common services
    expect(screen.getByText('EC2')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
    expect(screen.getByText('Lambda')).toBeInTheDocument();
  });
});
