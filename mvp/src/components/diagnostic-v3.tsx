'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveAnswer, pauseDiagnostic } from '@/app/actions';
import {
  type V3Answer,
  type V3Question,
  parseV3Answer,
  v3Statuses,
} from '@/lib/diagnostic-v3';
import { Button } from '@/components/ui/button';

const dataOptions = [
  'Faturamento/vendas do mês',
  'Quantidade de clientes/vendas',
  'Ticket médio/valor médio por venda',
  'Clientes que voltam/recompram',
  'Custos com fornecedores/estoque',
  'Salários e encargos',
  'Custos fixos',
  'Lucro/margem',
  'Fluxo de caixa/saldo',
  'Tempo do processo principal',
  'Erros, atrasos ou retrabalho',
  'Entradas e saídas de pessoas',
  'Satisfação/reclamações de clientes',
  'Não acompanho nenhum desses dados',
];

const radarAreas = [
  ['marketing_sales', 'Marketing e Vendas'],
  ['finance', 'Finanças'],
  ['operations', 'Operações/Processos'],
  ['people', 'Pessoas e RH'],
] as const;

function clean(value: string) {
  return value.trim();
}

function summaryLabel(id: string) {
  const labels: Record<string, string> = {
    v3_p1_focus: 'Principal preocupação',
    v3_p2_example: 'Exemplo informado',
    v3_p3_impact: 'Impacto estimado',
    v3_p4_goal: 'Situação atual e objetivo',
    v3_p5_deadline: 'Prazo desejado',
    v3_p6_blockers: 'Bloqueios percebidos',
    v3_p7_radar: 'Percepção das quatro áreas',
    v3_p8_data: 'Dados que você acompanha',
    v3_p9_evidence: 'Fontes/evidências disponíveis',
  };
  return labels[id] ?? id;
}

function displayAnswer(answer: V3Answer) {
  if (answer.unknown) return 'Não sei / dado ainda ausente';
  const parsed = parseV3Answer(answer.answer);
  if (!parsed || typeof parsed !== 'object') return answer.answer;
  if ('mode' in parsed) {
    const p = parsed as { mode?: string; value?: string; unit?: string };
    if (p.mode === 'unknown') return 'Não sei calcular ainda';
    return [p.value, p.unit].filter(Boolean).join(' · ') || String(p.mode ?? '');
  }
  if ('current' in parsed && 'target' in parsed) {
    const p = parsed as { current?: string; target?: string; unit?: string; period?: string };
    return `Hoje: ${p.current} ${p.unit} · Meta: ${p.target} ${p.unit} · Período: ${p.period}`;
  }
  if ('primary' in parsed) {
    const p = parsed as { selected?: string[]; primary?: string };
    return `Principal: ${p.primary}. Também marcados: ${(p.selected ?? []).join(', ')}`;
  }
  if ('marketing_sales' in parsed) {
    const p = parsed as Record<string, string>;
    return radarAreas.map(([key, label]) => `${label}: ${p[key]}`).join(' · ');
  }
  if ('selected' in parsed) return ((parsed as { selected?: string[] }).selected ?? []).join(', ');
  return JSON.stringify(parsed);
}

export function DiagnosticV3({
  sessionId,
  question,
  answers,
  readOnly,
}: {
  sessionId: string;
  question: V3Question;
  answers: V3Answer[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [text, setText] = useState('');
  const [single, setSingle] = useState('');
  const [impactMode, setImpactMode] = useState<'exact' | 'range' | 'other' | 'unknown'>('range');
  const [impactValue, setImpactValue] = useState('');
  const [impactUnit, setImpactUnit] = useState('R$ por mês');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('R$');
  const [period, setPeriod] = useState('por mês');
  const [selected, setSelected] = useState<string[]>([]);
  const [primary, setPrimary] = useState('');
  const [radar, setRadar] = useState<Record<string, string>>({});

  const prior = useMemo(() => answers.filter((a) => a.question_id !== question.id), [answers, question.id]);

  function toggle(item: string) {
    setSelected((old) => (old.includes(item) ? old.filter((x) => x !== item) : [...old, item]));
    if (primary === item && selected.includes(item)) setPrimary('');
  }

  function buildAnswer() {
    switch (question.kind) {
      case 'single':
      case 'evidence':
        return single;
      case 'text':
        return text;
      case 'impact':
        return JSON.stringify({ mode: impactMode, value: clean(impactValue), unit: clean(impactUnit) });
      case 'goal':
        return JSON.stringify({ current: clean(current), target: clean(target), unit: clean(unit), period: clean(period) });
      case 'multi-priority':
        return JSON.stringify({ selected, primary });
      case 'radar':
        return JSON.stringify(radar);
      case 'data':
        return JSON.stringify({ selected });
      case 'confirm':
        return 'confirmed';
    }
  }

  function ready() {
    if (question.kind === 'single' || question.kind === 'evidence') return !!single;
    if (question.kind === 'text') return !!clean(text);
    if (question.kind === 'impact') return impactMode === 'unknown' || !!clean(impactValue);
    if (question.kind === 'goal') return !!clean(current) && !!clean(target) && !!clean(unit) && !!clean(period);
    if (question.kind === 'multi-priority') return selected.length > 0 && !!primary;
    if (question.kind === 'radar') return radarAreas.every(([key]) => v3Statuses.includes(radar[key] as (typeof v3Statuses)[number]));
    if (question.kind === 'data') return selected.length > 0;
    return true;
  }

  async function submit(unknown = false) {
    setPending(true);
    setMessage('Salvando…');
    try {
      await saveAnswer({
        session_id: sessionId,
        question_id: question.id,
        answer: unknown ? '' : buildAnswer(),
        unknown,
        draft: false,
      });
      setMessage('Resposta salva.');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setPending(false);
    }
  }

  async function pause() {
    setPending(true);
    const form = new FormData();
    form.set('id', sessionId);
    try {
      await pauseDiagnostic(form);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não foi possível pausar.');
      setPending(false);
    }
  }

  return (
    <section className="question">
      <p className="eyebrow">Pergunta {question.step} de 10</p>
      <h2>{question.title}</h2>
      <p className="muted">{question.help}</p>
      <fieldset disabled={pending || readOnly}>
        {(question.kind === 'single' || question.kind === 'evidence') && (
          <div className="choices">
            {question.options?.map((option) => (
              <button
                type="button"
                key={option}
                className={single === option ? 'choice selected' : 'choice'}
                aria-pressed={single === option}
                onClick={() => setSingle(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question.kind === 'text' && (
          <label className="field">
            Seu exemplo
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={4000} />
          </label>
        )}

        {question.kind === 'impact' && (
          <div className="stack">
            <div className="choices">
              {[
                ['exact', 'Sei aproximadamente'],
                ['range', 'Consigo dar uma faixa'],
                ['other', 'Consigo medir em outra unidade'],
                ['unknown', 'Não sei calcular ainda'],
              ].map(([mode, label]) => (
                <button
                  type="button"
                  key={mode}
                  className={impactMode === mode ? 'choice selected' : 'choice'}
                  onClick={() => setImpactMode(mode as typeof impactMode)}
                >
                  {label}
                </button>
              ))}
            </div>
            {impactMode !== 'unknown' && (
              <>
                <label className="field">Valor ou faixa<input value={impactValue} onChange={(e) => setImpactValue(e.target.value)} placeholder="Ex.: 10.000 ou 5.000–10.000" /></label>
                <label className="field">Unidade<input value={impactUnit} onChange={(e) => setImpactUnit(e.target.value)} placeholder="Ex.: R$ por mês, clientes, horas" /></label>
              </>
            )}
          </div>
        )}

        {question.kind === 'goal' && (
          <div className="stack">
            <label className="field">Onde está hoje?<input value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Ex.: 32.000" /></label>
            <label className="field">Onde quer chegar?<input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Ex.: 50.000" /></label>
            <label className="field">Unidade<input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex.: R$, clientes, dias" /></label>
            <label className="field">Período<input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Ex.: por mês" /></label>
            <p className="caption">Evite abreviações ambíguas como “50 mi”. Escreva o valor e a unidade completos.</p>
          </div>
        )}

        {question.kind === 'multi-priority' && (
          <div className="stack">
            <div className="checkbox-group">
              {question.options?.map((option) => (
                <label key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />{option}</label>
              ))}
            </div>
            {selected.length > 0 && (
              <label className="field">Qual é o principal bloqueio?<select value={primary} onChange={(e) => setPrimary(e.target.value)}><option value="">Selecione</option>{selected.map((item) => <option key={item}>{item}</option>)}</select></label>
            )}
          </div>
        )}

        {question.kind === 'radar' && (
          <div className="stack">
            {radarAreas.map(([key, label]) => (
              <div className="panel" key={key}>
                <strong>{label}</strong>
                <div className="choices">
                  {v3Statuses.map((status) => (
                    <button type="button" key={status} className={radar[key] === status ? 'choice selected' : 'choice'} onClick={() => setRadar((old) => ({ ...old, [key]: status }))}>{status}</button>
                  ))}
                </div>
              </div>
            ))}
            <p className="caption">Verde = parece funcionar bem · Amarelo = merece atenção · Vermelho = vejo problema importante · Cinza = não acompanho/não sei avaliar.</p>
          </div>
        )}

        {question.kind === 'data' && (
          <div className="checkbox-group">
            {dataOptions.map((option) => (
              <label key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />{option}</label>
            ))}
          </div>
        )}

        {question.kind === 'confirm' && (
          <div className="stack">
            <div className="panel">
              <h3>O que entendemos até aqui</h3>
              {prior.map((answer) => (
                <div className="list-row" key={answer.question_id}>
                  <strong>{summaryLabel(answer.question_id)}</strong>
                  <span>{displayAnswer(answer)}</span>
                </div>
              ))}
            </div>
            <p className="muted">Ao confirmar, você está dizendo que este resumo representa o que quis informar. Isso não transforma percepções em fatos validados.</p>
          </div>
        )}

        <div className="row">
          <Button onClick={() => submit()} disabled={!ready()}>
            {question.kind === 'confirm' ? 'Está correto →' : 'Salvar e continuar →'}
          </Button>
          {question.kind !== 'confirm' && (
            <Button variant="outline" onClick={() => submit(true)}>Não sei responder</Button>
          )}
          <Button variant="ghost" onClick={pause}>Salvar e pausar</Button>
        </div>
      </fieldset>
      <p role="status" aria-live="polite">{message}</p>
    </section>
  );
}
