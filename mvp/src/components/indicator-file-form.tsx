'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadIndicatorFile } from '@/app/actions-indicators';
import { Button } from '@/components/ui/button';

export function IndicatorFileForm({ sessionId, indicatorKey }: { sessionId: string; indicatorKey: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(formData: FormData) {
    if (pending) return;
    formData.set('session_id', sessionId);
    formData.set('indicator_key', indicatorKey);
    setPending(true);
    setMessage('Enviando arquivo…');
    try {
      const result = await uploadIndicatorFile(formData);
      setMessage(`${result.file_name} recebido. O conteúdo ainda precisa ser lido e validado.`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível enviar o arquivo.');
    } finally {
      setPending(false);
    }
  }

  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Enviar arquivo</Button>;

  return (
    <form action={submit} className="stack">
      <label className="field">
        Arquivo
        <input name="file" type="file" required accept=".pdf,.csv,.txt,.png,.jpg,.jpeg,application/pdf,text/csv,text/plain,image/png,image/jpeg" />
      </label>
      <label className="field">
        Qual período esse arquivo representa? <span className="muted">(opcional)</span>
        <input name="period_label" placeholder="Ex.: agosto de 2026" maxLength={120} />
      </label>
      <p className="caption">Formatos aceitos: PDF, CSV, TXT, PNG e JPG. Máximo de 3 MB. Enviar o arquivo não significa que os números foram validados.</p>
      <div className="row">
        <Button type="submit" disabled={pending}>Enviar</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
      <p role="status" className="caption">{message}</p>
    </form>
  );
}
