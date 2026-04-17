/**
 * ResponsiveTable Usage Examples
 * 
 * This file demonstrates how to use the ResponsiveTable component
 * in various scenarios.
 */

import React from 'react';
import { ResponsiveTable, ColumnDef } from './ResponsiveTable';
import { Badge } from './badge';

// Example 1: Simple Product Table
interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive';
}

const productColumns: ColumnDef<Product>[] = [
  {
    key: 'name',
    header: 'Product Name',
    accessor: (item) => item.name,
    mobileProminent: true, // Shows at top of card on mobile
  },
  {
    key: 'sku',
    header: 'SKU',
    accessor: (item) => item.sku,
    mobileVisible: true, // Always visible on mobile
  },
  {
    key: 'price',
    header: 'Price',
    render: (item) => `$${item.price.toFixed(2)}`,
    mobileVisible: true,
  },
  {
    key: 'stock',
    header: 'Stock',
    render: (item) => (
      <span className={item.stock < 10 ? 'text-destructive font-medium' : ''}>
        {item.stock}
      </span>
    ),
    mobileVisible: true,
  },
  {
    key: 'category',
    header: 'Category',
    accessor: (item) => item.category,
    mobileVisible: false, // Hidden by default, shown in expand section
  },
  {
    key: 'status',
    header: 'Status',
    render: (item) => (
      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
        {item.status}
      </Badge>
    ),
    mobileVisible: false,
  },
];

const sampleProducts: Product[] = [
  { id: 1, name: 'Laptop Pro', sku: 'LAP-001', price: 1299.99, stock: 15, category: 'Electronics', status: 'active' },
  { id: 2, name: 'Wireless Mouse', sku: 'MOU-002', price: 29.99, stock: 5, category: 'Accessories', status: 'active' },
  { id: 3, name: 'USB-C Cable', sku: 'CAB-003', price: 12.99, stock: 50, category: 'Accessories', status: 'active' },
];

export function ProductTableExample() {
  return (
    <ResponsiveTable
      data={sampleProducts}
      columns={productColumns}
      pagination={true}
      pageSize={10}
      onRowClick={(product) => console.log('Clicked product:', product)}
      keyExtractor={(item) => `product-${item.id}`}
    />
  );
}

// Example 2: User Management Table with Custom Mobile Renderer
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'active' | 'inactive';
}

const userColumns: ColumnDef<User>[] = [
  { key: 'name', header: 'Name', accessor: (item) => item.name },
  { key: 'email', header: 'Email', accessor: (item) => item.email },
  { key: 'role', header: 'Role', accessor: (item) => item.role },
  { key: 'lastLogin', header: 'Last Login', accessor: (item) => item.lastLogin },
  {
    key: 'status',
    header: 'Status',
    render: (item) => (
      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
        {item.status}
      </Badge>
    ),
  },
];

const sampleUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', lastLogin: '2024-01-15', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', lastLogin: '2024-01-14', status: 'active' },
];

export function UserTableWithCustomMobileCard() {
  return (
    <ResponsiveTable
      data={sampleUsers}
      columns={userColumns}
      mobileCardRenderer={(user, isExpanded, onToggle) => (
        <div className="bg-card border rounded-lg p-4 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
              {user.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
          <p className="text-sm">Role: {user.role}</p>
          {isExpanded && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm">Last Login: {user.lastLogin}</p>
            </div>
          )}
        </div>
      )}
      keyExtractor={(item) => `user-${item.id}`}
    />
  );
}

// Example 3: Inventory Table with Loading State
export function InventoryTableWithLoading() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [inventory, setInventory] = React.useState<Product[]>([]);

  React.useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInventory(sampleProducts);
      setIsLoading(false);
    }, 2000);
  }, []);

  const inventoryColumns: ColumnDef<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      accessor: (item) => item.name,
      mobileProminent: true,
    },
    {
      key: 'stock',
      header: 'Current Stock',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span>{item.stock}</span>
          {item.stock < 10 && (
            <Badge variant="destructive">Low Stock</Badge>
          )}
        </div>
      ),
      mobileVisible: true,
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (item) => item.category,
      mobileVisible: false,
    },
  ];

  return (
    <ResponsiveTable
      data={inventory}
      columns={inventoryColumns}
      isLoading={isLoading}
      emptyMessage="No inventory items found"
      pagination={true}
      pageSize={20}
    />
  );
}

// Example 4: Simple Table without Pagination
export function SimpleTableExample() {
  const simpleColumns: ColumnDef<{ id: number; label: string; value: string }>[] = [
    {
      key: 'label',
      header: 'Label',
      accessor: (item) => item.label,
      mobileProminent: true,
    },
    {
      key: 'value',
      header: 'Value',
      accessor: (item) => item.value,
      mobileVisible: true,
    },
  ];

  const simpleData = [
    { id: 1, label: 'Total Sales', value: '$12,345' },
    { id: 2, label: 'Total Orders', value: '234' },
    { id: 3, label: 'Active Users', value: '45' },
  ];

  return (
    <ResponsiveTable
      data={simpleData}
      columns={simpleColumns}
      pagination={false}
      keyExtractor={(item) => `stat-${item.id}`}
    />
  );
}
