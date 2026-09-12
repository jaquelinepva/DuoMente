import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { context } from '@/lib/context';
import { areas, statuses } from '@/lib/domain';
import { ActionForm, Field } from '@/components/form';
import { saveDecision, linkEvidence } from '@/app/actions';
import { display, dateBR } from '@/lib/utils';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { client, org, role } = await context();
  const [{ data: d }, { data: evidence }, { data: links }, { data: history }, { data: objective }] =
    await Promise.all([
      client.from('decisions').select('*').eq('organization_id', org).eq('id', id).single(),
      client.from('evidence_items').select('*').eq('organization_id', org),
      client.from('decision_evidence').select('*').eq('organization_id', org).eq('decision_id', id),
      client
        .from('audit_logs')
        .select('*')
        .eq('organization_id', org)
        .eq('record_id', id)
        .order('created_at', { ascending: false }),
      client.from('global_objectives').select('*').eq('organization_id', org).maybeSingle(),
    ]);
  if (!d) notFound();
  const labels = [
    ['problem', 'Problema relacionado'],
    ['facts', 'Fatos e evidências'],
    ['hypotheses', 'Hipóteses'],
    ['missing', 'Informações ausentes'],
    ['recommendation', 'Recomendação da IA, se houver'],
    ['justification', 'Justificativa'],
    ['alternatives', 'Alternativas'],
    ['risks', 'Riscos'],
    ['urgency', 'Urgência'],
    ['confidence', 'Confiança'],
    ['expected', 'Resultado esperado'],
    ['observed', 'Resultado observado'],
    ['learning', 'Aprendizado'],
  ];
  return (
    <>
      <Link href="/app/decisoes">← Central de Decisões</Link>
      <div className="page-heading">
        <h1>{d.title}</h1>
        <span className="badge">{d.status}</span>
        <p>Objetivo relacionado: {display(objective?.description)}</p>
      </div>
      {role === 'viewer' ? (
        <section className="panel">
          <h2>{d.question}</h2>
          {labels.map(([k, l]) => (
            <p key={k}>
              <strong>{l}: </strong>
              {display(d.details[k])}
            </p>
          ))}
        </section>
      ) : (
        <ActionForm action={saveDecision} label="Salvar decisão">
          <input type="hidden" name="id" value={id} />
          <Field name="title" label="Título" defaultValue={d.title} required />
          <Field
            name="question"
            label="Pergunta que precisa ser respondida"
            defaultValue={d.question}
            required
            area
          />
          <div className="split">
            <label className="field">
              Área
              <select name="area" defaultValue={d.area}>
                {areas.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Status
              <select name="status" defaultValue={d.status}>
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <Field name="responsible" label="Responsável" defaultValue={d.responsible ?? ''} />
          <Field name="due_date" label="Prazo" type="date" defaultValue={d.due_date ?? ''} />
          {labels.map(([k, l]) => (
            <Field key={k} name={k} label={l} defaultValue={d.details[k] ?? ''} area />
          ))}
        </ActionForm>
      )}
      <section className="report-section">
        <h2>Evidências vinculadas</h2>
        {links?.length ? (
          links.map((l) => {
            const e = evidence?.find((e) => e.id === l.evidence_id);
            return (
              <p key={l.id}>
                <span className="badge">{e?.classification}</span> {e?.description}
              </p>
            );
          })
        ) : (
          <p>Nenhuma evidência vinculada.</p>
        )}
        {role !== 'viewer' &&
          !!evidence?.some((e) => !links?.some((l) => l.evidence_id === e.id)) && (
            <ActionForm action={linkEvidence} label="Vincular evidência">
              <input type="hidden" name="decision_id" value={id} />
              <label className="field">
                Evidência
                <select name="evidence_id">
                  {evidence
                    .filter((e) => !links?.some((l) => l.evidence_id === e.id))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.description}
                      </option>
                    ))}
                </select>
              </label>
            </ActionForm>
          )}
        <Link href="/app/diagnostico">Registrar outra evidência</Link>
      </section>
      <section className="report-section history">
        <h2>Histórico de alterações</h2>
        {history?.map((h) => (
          <details key={h.id}>
            <summary>
              {dateBR(h.created_at)} · {h.operation} · {h.created_by}
            </summary>
            <p>Antes</p>
            <pre>{JSON.stringify(h.old_data, null, 2)}</pre>
            <p>Depois</p>
            <pre>{JSON.stringify(h.new_data, null, 2)}</pre>
          </details>
        ))}
      </section>
    </>
  );
}
