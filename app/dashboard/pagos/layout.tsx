import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis pagos',
};

export default function PagosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
