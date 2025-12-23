import { CashGuard } from '@/components/pos/CashGuard';

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CashGuard>
      {children}
    </CashGuard>
  );
}