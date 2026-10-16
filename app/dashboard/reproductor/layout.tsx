import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reproductor',
};

export default function ReproductorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
