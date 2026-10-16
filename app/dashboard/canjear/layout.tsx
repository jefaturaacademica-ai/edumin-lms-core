import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canjear código',
};

export default function CanjearLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
