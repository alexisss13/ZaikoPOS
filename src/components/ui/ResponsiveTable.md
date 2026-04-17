# ResponsiveTable Component

A responsive table component that automatically transforms between table view (desktop) and card view (mobile) based on viewport size.

## Features

- **Automatic Layout Switching**: Table on desktop (≥768px), cards on mobile (<768px)
- **Tap-to-Expand**: Mobile cards can expand to show additional details
- **Touch-Friendly Pagination**: 44x44px minimum touch targets on mobile
- **Customizable Card Rendering**: Override default mobile card layout
- **Loading & Empty States**: Built-in skeleton loaders and empty state messages
- **Flexible Column Configuration**: Control which fields are visible/prominent on mobile

## Basic Usage

```tsx
import { ResponsiveTable, ColumnDef } from '@/components/ui/ResponsiveTable';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

const columns: ColumnDef<Product>[] = [
  {
    key: 'name',
    header: 'Product Name',
    accessor: (item) => item.name,
    mobileProminent: true, // Shows at top of card
  },
  {
    key: 'price',
    header: 'Price',
    render: (item) => `$${item.price.toFixed(2)}`,
    mobileVisible: true, // Always visible on mobile
  },
  {
    key: 'stock',
    header: 'Stock',
    accessor: (item) => item.stock,
    mobileVisible: false, // Hidden by default, shown when expanded
  },
];

const products: Product[] = [
  { id: 1, name: 'Laptop', price: 999, stock: 10 },
  { id: 2, name: 'Mouse', price: 29, stock: 50 },
];

function ProductTable() {
  return (
    <ResponsiveTable
      data={products}
      columns={columns}
      pagination={true}
      pageSize={10}
      onRowClick={(product) => console.log(product)}
    />
  );
}
```

## Props

### ResponsiveTableProps<T>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | **required** | Array of data items to display |
| `columns` | `ColumnDef<T>[]` | **required** | Column definitions |
| `mobileCardRenderer` | `(item: T, isExpanded: boolean, onToggle: () => void) => ReactNode` | `undefined` | Custom mobile card renderer |
| `onRowClick` | `(item: T) => void` | `undefined` | Callback when row/card is clicked |
| `isLoading` | `boolean` | `false` | Show loading skeleton |
| `pagination` | `boolean` | `false` | Enable pagination |
| `pageSize` | `number` | `10` | Items per page |
| `keyExtractor` | `(item: T, index: number) => string` | `undefined` | Custom key extractor |
| `className` | `string` | `undefined` | Additional CSS classes |
| `emptyMessage` | `string` | `'No data available'` | Empty state message |

### ColumnDef<T>

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Unique column identifier |
| `header` | `string` | Column header label |
| `render` | `(item: T) => ReactNode` | Custom cell renderer |
| `accessor` | `(item: T) => any` | Value accessor function |
| `mobileVisible` | `boolean` | Show in mobile card (always visible section) |
| `mobileProminent` | `boolean` | Show at top of mobile card (prominent section) |
| `className` | `string` | CSS classes for the column |

## Mobile Card Layout

Mobile cards have three sections:

1. **Prominent Fields** (`mobileProminent: true`): Shown at the top in larger text
2. **Visible Fields** (`mobileVisible: true`): Always visible in label-value pairs
3. **Hidden Fields** (default): Shown only when card is expanded

```tsx
const columns: ColumnDef<Product>[] = [
  {
    key: 'name',
    header: 'Name',
    mobileProminent: true, // → Top of card, large text
  },
  {
    key: 'price',
    header: 'Price',
    mobileVisible: true, // → Always visible
  },
  {
    key: 'description',
    header: 'Description',
    // No mobile flags → Hidden until expanded
  },
];
```

## Custom Mobile Card Renderer

For complete control over mobile card layout:

```tsx
<ResponsiveTable
  data={users}
  columns={columns}
  mobileCardRenderer={(user, isExpanded, onToggle) => (
    <div className="p-4 border rounded-lg" onClick={onToggle}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {isExpanded && (
        <div className="mt-2">
          <p>Role: {user.role}</p>
          <p>Last Login: {user.lastLogin}</p>
        </div>
      )}
    </div>
  )}
/>
```

## Pagination

Enable pagination with touch-friendly controls:

```tsx
<ResponsiveTable
  data={products}
  columns={columns}
  pagination={true}
  pageSize={20}
/>
```

Mobile pagination buttons are 44x44px minimum for easy tapping.

## Loading State

Show skeleton loaders while data is loading:

```tsx
<ResponsiveTable
  data={products}
  columns={columns}
  isLoading={isLoadingProducts}
/>
```

## Empty State

Customize the empty state message:

```tsx
<ResponsiveTable
  data={[]}
  columns={columns}
  emptyMessage="No products found. Try adjusting your filters."
/>
```

## Accessibility

- All pagination buttons have `aria-label` attributes
- Mobile cards have proper keyboard navigation
- Touch targets meet 44x44px minimum size requirement
- Proper semantic HTML (table on desktop)

## Requirements Validation

This component satisfies the following requirements from the mobile-responsive-design spec:

- **Requirement 3.1**: Table transforms to cards on mobile (< 768px)
- **Requirement 3.2**: Cards show 3-4 key fields prominently
- **Requirement 3.3**: Tap-to-expand functionality for full details
- **Requirement 3.4**: Touch-friendly pagination (44x44px minimum)
- **Requirement 3.8**: Pagination controls are touch-friendly

## Examples

See `ResponsiveTable.example.tsx` for complete usage examples including:
- Product table with stock indicators
- User management with custom mobile cards
- Inventory table with loading state
- Simple table without pagination
