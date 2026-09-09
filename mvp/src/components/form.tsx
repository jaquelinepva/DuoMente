'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export function ActionForm({
  action,
  children,
  label = 'Salvar',
  className = 'stack',
}: {
  action: (form: FormData) => Promise<void>;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState('');
  return (
    <form
      className={className}
      action={async (form) => {
        setPending(true);
        setMessage('');
        try {
          await action(form);
          setMessage('Salvo com sucesso.');
        } catch (e) {
          if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e;
          setMessage(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.');
        } finally {
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
