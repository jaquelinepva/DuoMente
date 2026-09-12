'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveManualIndicatorData } from '@/app/actions-indicators';
import { Button } from '@/components/ui/button';

export function IndicatorDataForm({ sessionId, indicatorKey, label }: { sessionId: string; indicatorKey: string; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [period, setPeriod] = useState('último mês');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    if (!value.trim() || !period.trim() || pending) return;
    setPending(true); setMessage('Salvando…');
    try {
      await saveManualIndicatorData({ session_id: sessionId, indicator_key: indicatorKey, value_text: value, period_label: period });
      setMessage('Valor recebido. Ainda precisa ser validado.');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally { setPending(false); }
  }

  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Informar agora</Button>;
  return <div className="stack">
    <label className="field">{label}<input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Digite o valor que você conhece" /></label>
    <label className="field">De qual período é esse número?<input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Ex.: agosto de 2026" /></label>
    <div className="row"><Button onClick={submit} disabled={pending || !value.trim() || !period.trim()}>Salvar valor</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button></div>
    <p role="status" className="caption">{message}</p>
  </div>;
}
