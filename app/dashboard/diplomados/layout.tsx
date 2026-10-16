import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis diplomados',
};

export default function DiplomadosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
