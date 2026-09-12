'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startV3Diagnostic } from '@/app/actions-v3';
import { Button } from '@/components/ui/button';

export function StartV3Diagnostic({ label = 'Iniciar Diagnóstico v3' }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function start() {
    if (pending) return;
    setPending(true);
    setMessage('Preparando diagnóstico…');
    try {
      await startV3Diagnostic();
      setMessage('Diagnóstico iniciado.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o diagnóstico.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <Button type="button" onClick={start} disabled={pending}>
        {pending ? 'Iniciando…' : label}
      </Button>
      <p role="status" aria-live="polite">{message}</p>
    </div>
  );
}
