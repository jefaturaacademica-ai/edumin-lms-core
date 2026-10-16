import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis cursos',
};

export default function CursosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
