'use client';

import React, { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft01Icon, ArrowRight01Icon, ArrowLeft02Icon, ArrowRight02Icon, ArrowDown01Icon, ArrowUp01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

/**
 * Column definition for ResponsiveTable
 */
export interface ColumnDef<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  header: string;
  /** Custom render function for cell content */
  render?: (item: T) => React.ReactNode;
  /** Accessor function to get value from item */
  accessor?: (item: T) => any;
  /** Whether to show this field in mobile card view */
  mobileVisible?: boolean;
  /** Whether this is a prominent field in mobile card (shown at top) */
  mobileProminent?: boolean;
  /** CSS classes for the column */
  className?: string;
}

/**
 * Props for ResponsiveTable component
 */
export interface ResponsiveTableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Custom renderer for mobile card layout */
  mobileCardRenderer?: (item: T, isExpanded: boolean, onToggle: () => void) => React.ReactNode;
  /** Callback when a row/card is clicked */
  onRowClick?: (item: T) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Enable pagination */
  pagination?: boolean;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Custom key extractor for list items */
  keyExtractor?: (item: T, index: number) => string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * ResponsiveTable Component
 * 
 * Transforms between table view (desktop) and card view (mobile).
 * - Desktop (>= 768px): Traditional table layout
 * - Mobile (< 768px): Card layout with tap-to-expand functionality
 * 
 * Features:
 * - Automatic layout switching based on viewport
 * - Touch-friendly pagination controls (44x44px minimum)
 * - Expandable cards on mobile for full details
 * - Customizable card rendering
 * - Loading and empty states
 */
export function ResponsiveTable<T>({
  data,
  columns,
  mobileCardRenderer,
  onRowClick,
  isLoading = false,
  pagination = false,
  pageSize = 10,
  keyExtractor,
  className,
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  const { isMobile } = useResponsive();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Calculate pagination
  const totalPages = pagination ? Math.ceil(data.length / pageSize) : 1;
  const startIndex = pagination ? (currentPage - 1) * pageSize : 0;
  const endIndex = pagination ? startIndex + pageSize : data.length;
  const paginatedData = data.slice(startIndex, endIndex);

  // Default key extractor
  const getKey = keyExtractor || ((item: T, index: number) => `item-${index}`);

  // Toggle card expansion
  const toggleCardExpansion = (key: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        {isMobile ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg">
            <div className="animate-pulse p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn('w-full space-y-2', className)}>
        {paginatedData.map((item, index) => {
          const key = getKey(item, startIndex + index);
          const isExpanded = expandedCards.has(key);

          // Use custom renderer if provided
          if (mobileCardRenderer) {
            return (
              <div key={key}>
                {mobileCardRenderer(item, isExpanded, () => toggleCardExpansion(key))}
              </div>
            );
          }

          // Default card renderer
          const prominentFields = columns.filter((col) => col.mobileProminent);
          const visibleFields = columns.filter((col) => col.mobileVisible && !col.mobileProminent);
          const hiddenFields = columns.filter((col) => !col.mobileVisible && !col.mobileProminent);

          return (
            <Card
              key={key}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                onRowClick && 'active:scale-[0.98]'
              )}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-4">
                {/* Prominent fields - always visible */}
                {prominentFields.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {prominentFields.map((col) => (
                      <div key={col.key} className="font-medium text-base">
                        {col.render
                          ? col.render(item)
                          : col.accessor
                          ? col.accessor(item)
                          : (item as any)[col.key]}
                      </div>
                    ))}
                  </div>
                )}

                {/* Always visible fields */}
                {visibleFields.length > 0 && (
                  <div className="space-y-1.5 text-sm">
                    {visibleFields.map((col) => (
                      <div key={col.key} className="flex justify-between items-center">
                        <span className="text-muted-foreground">{col.header}:</span>
                        <span className="font-medium">
                          {col.render
                            ? col.render(item)
                            : col.accessor
                            ? col.accessor(item)
                            : (item as any)[col.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expandable section */}
                {hiddenFields.length > 0 && (
                  <>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-1.5 text-sm">
                        {hiddenFields.map((col) => (
                          <div key={col.key} className="flex justify-between items-center">
                            <span className="text-muted-foreground">{col.header}:</span>
                            <span className="font-medium">
                              {col.render
                                ? col.render(item)
                                : col.accessor
                                ? col.accessor(item)
                                : (item as any)[col.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expand/Collapse button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCardExpansion(key);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors min-h-[44px]"
                      aria-label={isExpanded ? 'Show less' : 'Show more'}
                    >
                      {isExpanded ? (
                        <>
                          Show less <ArrowUp01Icon size={16} strokeWidth={2} />
                        </>
                      ) : (
                        <>
                          Show more <ArrowDown01Icon size={16} strokeWidth={2} />
                        </>
                      )}
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Mobile pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="min-w-[44px] min-h-[44px]"
              aria-label="First page"
            >
              <ArrowLeft02Icon size={16} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="min-w-[44px] min-h-[44px]"
              aria-label="Previous page"
            >
              <ArrowLeft01Icon size={16} strokeWidth={2} />
            </Button>
            <span className="text-sm font-medium px-4">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="min-w-[44px] min-h-[44px]"
              aria-label="Next page"
            >
              <ArrowRight01Icon size={16} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="min-w-[44px] min-h-[44px]"
              aria-label="Last page"
            >
              <ArrowRight02Icon size={16} strokeWidth={2} />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn('w-full', className)}>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => {
              const key = getKey(item, startIndex + index);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'border-t transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-sm', col.className)}>
                      {col.render
                        ? col.render(item)
                        : col.accessor
                        ? col.accessor(item)
                        : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Desktop pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ArrowLeft02Icon size={16} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ArrowLeft01Icon size={16} strokeWidth={2} />
            </Button>
            <span className="text-sm font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ArrowRight01Icon size={16} strokeWidth={2} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <ArrowRight02Icon size={16} strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
