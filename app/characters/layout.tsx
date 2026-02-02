import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Personajes | Continuum',
  description: 'Galeria de personajes para generacion de contenido con IA',
};

export default function CharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
