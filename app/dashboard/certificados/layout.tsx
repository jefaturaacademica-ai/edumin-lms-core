import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis certificados',
};

export default function CertificadosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
