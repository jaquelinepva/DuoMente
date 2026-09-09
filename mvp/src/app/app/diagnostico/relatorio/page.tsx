import Link from 'next/link';
export const maxDuration = 60;
import { context } from '@/lib/context';
import { reportSchema, classifications, questions } from '@/lib/domain';
import { display, dateBR } from '@/lib/utils';
import { approveReport, generateReport } from '@/app/actions';
import { ActionForm } from '@/components/form';
export default async function ReportPage() {
  const { client, org, role } = await context();
  const [
    { data: sessions },
    { data: objective },
    { data: company },
    { data: evidence },
    { data: business },
  ] = await Promise.all([
    client
      .from('diagnostic_sessions')
      .select('*')
      .eq('organization_id', org)
      .order('created_at', { ascending: false })
      .limit(1),
    client.from('global_objectives').select('*').eq('organization_id', org).maybeSingle(),
    client.from('organizations').select('*').eq('id', org).single(),
    client.from('evidence_items').select('*').eq('organization_id', org),
    client.from('business_profiles').select('*').eq('organization_id', org).maybeSingle(),
  ]);
  const session = sessions?.[0];
  const { data: profileAnswers } = session
    ? await client
        .from('diagnostic_answers')
        .select('question_id,answer,unknown')
        .eq('organization_id', org)
        .eq('session_id', session.id)
        .eq('is_draft', false)
    : { data: [] };
  const parsed = reportSchema.safeParse(session?.report);
  if (!parsed.success)
    return (
      <>
        <h1>Relatório do diagnóstico</h1>
        <p>Conclua as perguntas e confirme seu objetivo global para gerar o relatório.</p>
        <Link className="button" href="/app/diagnostico">
          Continuar diagnóstico →
        </Link>
      </>
    );
  const r = parsed.data;
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">{company?.name} · DIAGNÓSTICO</p>
        <h1>
          O que sabemos.
          <br />O que precisamos decidir.
        </h1>
        <p>
          {session.report_approved_at
            ? `Confirmado em ${dateBR(session.report_approved_at)}`
            : 'Aguardando sua revisão e confirmação.'}
        </p>
      </div>
      <section className="report-section">
        <h2>Resumo executivo</h2>
        <p>{r.summary}</p>
      </section>
      <section className="report-section">
        <h2>Perfil da empresa</h2>
        <p>
          {company?.name} · {company?.industry}
        </p>
        {profileAnswers
          ?.filter((a) =>
            questions.some((q) => q.id === a.question_id && q.stage === 1 && q.id !== 'concern'),
          )
          .map((a) => (
            <p key={a.question_id}>
              <strong>{questions.find((q) => q.id === a.question_id)?.text}</strong>
              <br />
              {a.answer}{' '}
              <span className="badge">{a.unknown ? 'Dado ausente' : 'Dado declarado'}</span>
            </p>
          ))}
        {Object.entries(business?.details ?? {}).map(([k, v]) => (
          <p key={k}>
            {k}: {display(v)}
          </p>
        ))}
      </section>
      <section className="report-section">
        <h2>Objetivo global confirmado</h2>
        <p>{display(objective?.description)}</p>
        <p>
          Indicador: {display(objective?.indicator)} · Atual: {display(objective?.current_value)} ·
          Meta: {display(objective?.target_value)}
        </p>
        <p>
          Prazo: {dateBR(objective?.due_date)} · Responsável: {display(objective?.responsible)}
        </p>
      </section>
      <section className="report-section">
        <h2>Problemas percebidos</h2>
        {r.perceived_problems.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>
      {classifications.map((c) => (
        <section className="report-section" key={c}>
          <h2>{c}</h2>
          {r.claims.filter((x) => x.classification === c).length ? (
            r.claims
              .filter((x) => x.classification === c)
              .map((x, i) => (
                <div key={i}>
                  <p>{x.text}</p>
                  <p className="caption">
                    Confiança: {x.confidence} · Fontes:{' '}
                    {x.evidence_ids
                      .map((id) => evidence?.find((e) => e.id === id)?.source || id)
                      .join('; ') || 'N/D'}
                  </p>
                </div>
              ))
          ) : (
            <p>Nenhum registro nesta classificação.</p>
          )}
        </section>
      ))}
      <section className="report-section">
        <h2>Análise das quatro áreas</h2>
        {r.area_analysis.map((a) => (
          <article key={a.area}>
            <h3>{a.area}</h3>
            <p>{a.analysis}</p>
          </article>
        ))}
      </section>
      <section className="report-section">
        <h2>Relações possíveis entre áreas</h2>
        {r.relationships.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>
      <section className="report-section">
        <h2>Prioridades e decisões necessárias</h2>
        {r.priorities.map((p, i) => (
          <article className="panel" key={i}>
            <span className="eyebrow">
              PRIORIDADE {i + 1} · {p.area}
            </span>
            <h3>{p.title}</h3>
            <p>Decisão: {p.decision}</p>
            <p>Informação que falta: {p.missing_information}</p>
            <p>Impacto possível: {p.possible_impact}</p>
            <p>Próxima ação: {p.next_action}</p>
            <p>
              Responsável: {display(p.responsible)} · Prazo sugerido:{' '}
              {display(p.suggested_deadline)}
            </p>
            <p>
              Urgência: {p.urgency} · Confiança: {p.confidence}
            </p>
            <Link href="/app/decisoes">Registrar uma decisão a partir desta prioridade →</Link>
          </article>
        ))}
      </section>
      <section className="report-section">
        <h2>Plano inicial de 30 dias</h2>
        {r.plan_30_days.map((a, i) => (
          <div className="list-row" key={i}>
            <div>
              <strong>{a.action}</strong>
              <p>{display(a.responsible)}</p>
            </div>
            <span>{a.period}</span>
          </div>
        ))}
        <p className="caption">Plano sugerido. Registre em Ações os passos que você aprovar.</p>
        <Link href="/app/acoes">Organizar ações →</Link>
      </section>
      <section className="report-section">
        <h2>Limitações</h2>
        {r.limitations.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </section>
      <section className="report-section">
        <h2>Evidências utilizadas</h2>
        {evidence
          ?.filter((e) =>
            [...r.claims, ...r.area_analysis, ...r.priorities].some((x) =>
              x.evidence_ids.includes(e.id),
            ),
          )
          .map((e) => (
            <div className="panel" key={e.id}>
              <span className="badge">{e.classification}</span>
              <p>{e.description}</p>
              <p>
                Fonte: {display(e.source)} · Período: {display(e.period)} · Responsável:{' '}
                {display(e.responsible)}
              </p>
              <p>
                Premissas: {display(e.assumptions)} · Registro: {dateBR(e.created_at)}
              </p>
            </div>
          ))}
      </section>
      {role !== 'viewer' && !session.report_approved_at && (
        <ActionForm action={approveReport} label="Confirmar conclusões do diagnóstico">
          <input type="hidden" name="id" value={session.id} />
          <label>
            <input type="checkbox" required />
            Revisei as conclusões, hipóteses, prioridades e limitações.
          </label>
        </ActionForm>
      )}
      {role !== 'viewer' && (
        <details>
          <summary>Gerar nova versão com os dados atuais</summary>
          <ActionForm action={generateReport} label="Gerar nova versão para revisão">
            <input type="hidden" name="id" value={session.id} />
            <p>
              A nova versão substituirá a visualização atual e precisará de nova confirmação. O
              histórico será preservado na auditoria.
            </p>
          </ActionForm>
        </details>
      )}
    </>
  );
}
