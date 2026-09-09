'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="container">
      <h1>Não foi possível carregar esta página.</h1>
      <p>
        Verifique sua conexão e tente novamente. Se o problema continuar, entre novamente na conta.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
      <p>
        <Link href="/login">Ir para o login</Link>
      </p>
    </main>
  );
}
