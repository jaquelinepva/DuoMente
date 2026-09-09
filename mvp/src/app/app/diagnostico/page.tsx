import Link from 'next/link';
export const maxDuration = 60;
import { context } from '@/lib/context';
import { nextQuestion, activeQuestions, questions } from '@/lib/domain';
import { Diagnostic } from '@/components/diagnostic';
import { ActionForm } from '@/components/form';
import { EvidenceForm, ObjectiveForm } from '@/components/business-forms';
import { startDiagnostic, pauseDiagnostic, generateReport, openEvidence } from '@/app/actions';
export default async function Page() {
  const { client, org, role } = await context();
  const { data: sessions } = await client
    .from('diagnostic_sessions')
    .select('*')
    .eq('organization_id', org)
    .order('created_at', { ascending: false })
    .limit(1);
  const session = sessions?.[0];
  const { data: answers } = session
    ? await client
        .from('diagnostic_answers')
        .select('*')
        .eq('organization_id', org)
        .eq('session_id', session.id)
        .order('created_at')
    : { data: [] };
  const completed = answers?.filter((a) => !a.is_draft) ?? [];
  const q = nextQuestion(completed);
  const { data: objective } = await client
    .from('global_objectives')
    .select('*')
    .eq('organization_id', org)
    .maybeSingle();
  const { data: evidence } = await client
    .from('evidence_items')
    .select('*')
    .eq('organization_id', org)
    .order('created_at', { ascending: false });
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">DIAGNÓSTICO EMPRESARIAL</p>
        <h1>Vamos entender juntos.</h1>
        <p className="muted">Uma pergunta por vez. Você pode pausar e continuar depois.</p>
      </div>
      {!session ? (
        <ActionForm action={startDiagnostic} label="Iniciar diagnóstico">
          <p>
            Antes de mostrar números, vamos entender o seu negócio e descobrir quais decisões
            precisam da sua atenção.
          </p>
        </ActionForm>
      ) : (
        <>
          <progress
            value={completed.length}
            max={activeQuestions(completed).length}
            aria-label="Progresso"
          />
          {session.status === 'completed' ? (
            <p>
              Diagnóstico confirmado. <Link href="/app/diagnostico/relatorio">Ver relatório</Link>
            </p>
          ) : q ? (
            <Diagnostic
              key={q.id}
              sessionId={session.id}
              question={q}
              draft={answers?.find((a) => a.question_id === q.id)?.answer ?? ''}
              readOnly={role === 'viewer'}
            />
          ) : (
            <section className="panel">
              <h2>As respostas estão registradas.</h2>
              <p>Confirme seu objetivo global abaixo e gere o relatório para revisão.</p>
              {role !== 'viewer' && (
                <ActionForm action={generateReport} label="Gerar relatório para revisão">
                  <input type="hidden" name="id" value={session.id} />
                </ActionForm>
              )}
            </section>
          )}
          {role !== 'viewer' && !q && session.status !== 'completed' && (
            <ActionForm action={pauseDiagnostic} label="Pausar diagnóstico">
              <input type="hidden" name="id" value={session.id} />
            </ActionForm>
          )}
          <details>
            <summary>Respostas registradas ({completed.length})</summary>
            {completed.map((a) => (
              <div className="list-row" key={a.id}>
                <div>
                  <strong>{questions.find((q) => q.id === a.question_id)?.text}</strong>
                  <p>{a.answer}</p>
                </div>
                <span className="badge">{a.unknown ? 'Dado ausente' : 'Dado declarado'}</span>
              </div>
            ))}
          </details>
        </>
      )}
      {role !== 'viewer' && (
        <>
          <details open={q?.stage === 4 || (!!session && !q && !objective)}>
            <summary>Objetivo global {objective?.confirmed_at ? '· confirmado' : ''}</summary>
            <ObjectiveForm value={objective ?? {}} />
          </details>
          <details>
            <summary>Registrar uma evidência</summary>
            <EvidenceForm />
          </details>
        </>
      )}
      <details>
        <summary>Evidências registradas ({evidence?.length ?? 0})</summary>
        {evidence?.map((e) => (
          <article className="panel" key={e.id}>
            <span className="badge">{e.classification}</span>
            <p>{e.description}</p>
            <p className="caption">
              Fonte: {e.source || 'N/D'} · Período: {e.period || 'N/D'} · Confiança: {e.confidence}
            </p>
            {e.storage_path && (
              <ActionForm action={openEvidence} label="Baixar anexo">
                <input type="hidden" name="id" value={e.id} />
              </ActionForm>
            )}
          </article>
        ))}
      </details>
    </>
  );
}
