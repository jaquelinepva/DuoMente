'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveAnswer, pauseDiagnostic } from '@/app/actions';
import { type Question } from '@/lib/domain';
import { Button } from '@/components/ui/button';
export function Diagnostic({
  sessionId,
  question,
  draft,
  readOnly,
}: {
  sessionId: string;
  question: Question;
  draft: string;
  readOnly: boolean;
}) {
  const [value, setValue] = useState(draft),
    [message, setMessage] = useState(''),
    [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const router = useRouter();
  const payload = (answer: string, unknown = false, isDraft = true) => ({
    session_id: sessionId,
    question_id: question.id,
    answer,
    unknown,
    draft: isDraft,
  });
  async function pause() {
    if (timer.current) clearTimeout(timer.current);
    setPending(true);
    try {
      await queue.current;
      await saveAnswer(payload(value));
      const form = new FormData();
      form.set('id', sessionId);
      await pauseDiagnostic(form);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível pausar.');
      setPending(false);
    }
  }
  function change(text: string) {
    setValue(text);
    setMessage('Alteração pendente…');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      queue.current = queue.current
        .catch(() => {})
        .then(() => saveAnswer(payload(text)))
        .then(() => setMessage('Rascunho salvo.'))
        .catch(() => setMessage('Falha ao salvar. Continue conectado e tente novamente.'));
    }, 700);
  }
  async function submit(unknown = false) {
    if (timer.current) clearTimeout(timer.current);
    setPending(true);
    try {
      await queue.current;
      await saveAnswer(payload(value, unknown, false));
      setMessage('Resposta salva.');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="question">
      <p className="eyebrow">
        Etapa {question.stage} de 7 {question.area && ` · ${question.area}`}
      </p>
      <h2>{question.text}</h2>
      <p className="muted">{question.why}</p>
      <fieldset disabled={pending || readOnly}>
        <div className="choices">
          {question.options?.map((option) => (
            <button
              type="button"
              key={option}
              className={value === option ? 'choice selected' : 'choice'}
              aria-pressed={value === option}
              onClick={() => change(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="field">
          Sua resposta
          <textarea
            value={value}
            onChange={(e) => change(e.target.value)}
            rows={4}
            maxLength={6000}
          />
        </label>
        <div className="row">
          <Button onClick={() => submit()} disabled={!value.trim()}>
            Salvar e continuar →
          </Button>
          <Button variant="outline" onClick={() => submit(true)}>
            Não sei responder
          </Button>
          <Button variant="ghost" onClick={pause}>
            Salvar e pausar
          </Button>
        </div>
      </fieldset>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
