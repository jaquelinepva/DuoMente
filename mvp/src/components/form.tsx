'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
export function ActionForm({
  action,
  children,
  label = 'Salvar',
  className = 'stack',
  idempotent = false,
  successMessage = 'Salvo com sucesso.',
}: {
  action: (form: FormData) => Promise<void | { error: string }>;
  children: React.ReactNode;
  label?: string;
  className?: string;
  idempotent?: boolean;
  successMessage?: string;
}) {
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState('');
  const busy = useRef(false);
  const requestId = useRef<string | null>(null);
  return (
    <form
      className={className}
      onSubmit={(event) => {
        if (busy.current) event.preventDefault();
        else busy.current = true;
      }}
      action={async (form) => {
        if (idempotent) {
          requestId.current ??= crypto.randomUUID();
          form.set('request_id', requestId.current);
        }
        setPending(true);
        setMessage('');
        try {
          const result = await action(form);
          setMessage(result?.error ?? successMessage);
          if (!result?.error) requestId.current = null;
        } catch (e) {
          if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e;
          setMessage(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.');
        } finally {
          busy.current = false;
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending}>{children}</fieldset>
      <div aria-live="polite" role="status">
        {message}
      </div>
      <Button disabled={pending} type="submit">
        {pending ? 'Salvando…' : label}
      </Button>
    </form>
  );
}
export function Field({
  label,
  name,
  defaultValue = '',
  type = 'text',
  required = false,
  area = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  area?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {area ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={3}
          maxLength={6000}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          maxLength={2000}
        />
      )}
    </label>
  );
}
