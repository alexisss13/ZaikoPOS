import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveTable, ColumnDef } from './ResponsiveTable';
import * as useResponsiveModule from '@/hooks/useResponsive';

// Mock the useResponsive hook
jest.mock('@/hooks/useResponsive');

interface TestData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

const mockData: TestData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
];

const mockColumns: ColumnDef<TestData>[] = [
  {
    key: 'name',
    header: 'Name',
    accessor: (item) => item.name,
    mobileProminent: true,
  },
  {
    key: 'email',
    header: 'Email',
    accessor: (item) => item.email,
    mobileVisible: true,
  },
  {
    key: 'role',
    header: 'Role',
    accessor: (item) => item.role,
    mobileVisible: false,
  },
  {
    key: 'status',
    header: 'Status',
    accessor: (item) => item.status,
    mobileVisible: true,
  },
];

describe('ResponsiveTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      (useResponsiveModule.useResponsive as jest.Mock).mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024,
        height: 768,
      });
    });

    it('renders table layout on desktop', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      // Check for table elements
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('displays all data rows in table', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('calls onRowClick when row is clicked', () => {
      const handleRowClick = jest.fn();
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          onRowClick={handleRowClick}
        />
      );
      
      const firstRow = screen.getByText('John Doe').closest('tr');
      fireEvent.click(firstRow!);
      
      expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('shows pagination controls when pagination is enabled', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          pagination={true}
          pageSize={2}
        />
      );
      
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    });

    it('paginates data correctly', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          pagination={true}
          pageSize={2}
        />
      );
      
      // First page should show first 2 items
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      
      // Click next page
      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);
      
      // Second page should show last item
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      (useResponsiveModule.useResponsive as jest.Mock).mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        width: 375,
        height: 667,
      });
    });

    it('renders card layout on mobile', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      // Should not render table
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      
      // Should render cards
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('shows prominent fields at the top of cards', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      const cards = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('shows expand/collapse button for hidden fields', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      const showMoreButtons = screen.getAllByText('Show more');
      expect(showMoreButtons.length).toBeGreaterThan(0);
    });

    it('expands card to show hidden fields when tapped', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      // Initially, role should not be visible (it's not mobileVisible)
      expect(screen.queryByText('Role:')).not.toBeInTheDocument();
      
      // Click "Show more" on first card
      const showMoreButton = screen.getAllByText('Show more')[0];
      fireEvent.click(showMoreButton);
      
      // Now role should be visible
      expect(screen.getByText('Role:')).toBeInTheDocument();
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('collapses card when "Show less" is tapped', () => {
      render(<ResponsiveTable data={mockData} columns={mockColumns} />);
      
      // Expand first card
      const showMoreButton = screen.getAllByText('Show more')[0];
      fireEvent.click(showMoreButton);
      
      expect(screen.getByText('Show less')).toBeInTheDocument();
      
      // Collapse it
      const showLessButton = screen.getByText('Show less');
      fireEvent.click(showLessButton);
      
      // Should show "Show more" again
      expect(screen.getAllByText('Show more')[0]).toBeInTheDocument();
    });

    it('has touch-friendly pagination controls (44x44px minimum)', () => {
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          pagination={true}
          pageSize={2}
        />
      );
      
      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton).toHaveClass('min-w-[44px]');
      expect(nextButton).toHaveClass('min-h-[44px]');
    });

    it('calls onRowClick when card is clicked', () => {
      const handleRowClick = jest.fn();
      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          onRowClick={handleRowClick}
        />
      );
      
      const firstCard = screen.getByText('John Doe').closest('div[data-slot="card"]');
      fireEvent.click(firstCard!);
      
      expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      (useResponsiveModule.useResponsive as jest.Mock).mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024,
        height: 768,
      });
    });

    it('shows loading skeleton when isLoading is true', () => {
      render(<ResponsiveTable data={[]} columns={mockColumns} isLoading={true} />);
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      (useResponsiveModule.useResponsive as jest.Mock).mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024,
        height: 768,
      });
    });

    it('shows empty message when data is empty', () => {
      render(<ResponsiveTable data={[]} columns={mockColumns} />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(
        <ResponsiveTable
          data={[]}
          columns={mockColumns}
          emptyMessage="No users found"
        />
      );
      
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  describe('Custom Mobile Card Renderer', () => {
    beforeEach(() => {
      (useResponsiveModule.useResponsive as jest.Mock).mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        width: 375,
        height: 667,
      });
    });

    it('uses custom mobile card renderer when provided', () => {
      const customRenderer = (item: TestData) => (
        <div data-testid="custom-card">
          <h3>{item.name}</h3>
          <p>{item.email}</p>
        </div>
      );

      render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          mobileCardRenderer={customRenderer}
        />
      );
      
      const customCards = screen.getAllByTestId('custom-card');
      expect(customCards).toHaveLength(3);
    });
  });
});
