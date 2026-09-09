import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'DuoMente — Clareza para decidir', template: '%s | DuoMente' },
  description: 'Entenda seu negócio, organize evidências e transforme decisões em ações.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#main">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
