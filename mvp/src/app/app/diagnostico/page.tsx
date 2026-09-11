import { context } from '@/lib/context';
import { isV3QuestionId, nextV3Question, v3Progress, v3Questions } from '@/lib/diagnostic-v3';
import { DiagnosticV3Live } from '@/components/diagnostic-v3-live';
import { StartV3Diagnostic } from '@/components/start-v3-diagnostic';
import { ActionForm } from '@/components/form';
import { EvidenceForm } from '@/components/business-forms';
import { openEvidence } from '@/app/actions';

export default async function Page() {
  const { client, org, role } = await context();
  const { data: sessions } = await client
    .from('diagnostic_sessions')
    .select('*')
    .eq('organization_id', org)
    .order('created_at', { ascending: false })
    .limit(2);
  const session = sessions?.[0];
  const previousSession = sessions?.[1];

  const { data: answers } = session
    ? await client
        .from('diagnostic_answers')
        .select('*')
        .eq('organization_id', org)
        .eq('session_id', session.id)
        .order('created_at')
    : { data: [] };

  const completed = answers?.filter((a) => !a.is_draft) ?? [];
  const v3Answers = completed.filter((a) => isV3QuestionId(a.question_id));
  const legacyAnswers = completed.filter((a) => !isV3QuestionId(a.question_id));

  const isFreshV3Session = !!session && completed.length === 0 && !!previousSession;
  const hasV3 = isFreshV3Session || v3Answers.length > 0;
  const q = hasV3 ? nextV3Question(v3Answers) : undefined;

  let preservedLegacyCount = legacyAnswers.length;
  if (isFreshV3Session && previousSession) {
    const { data: previousAnswers } = await client
      .from('diagnostic_answers')
      .select('question_id,is_draft')
      .eq('organization_id', org)
      .eq('session_id', previousSession.id);
    preservedLegacyCount =
      previousAnswers?.filter((a) => !a.is_draft && !isV3QuestionId(a.question_id)).length ?? 0;
  }

  const { data: evidence } = await client
    .from('evidence_items')
    .select('*')
    .eq('organization_id', org)
    .order('created_at', { ascending: false });

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">DIAGNÓSTICO EMPRESARIAL · V3</p>
        <h1>Entender primeiro. Medir depois.</h1>
        <p className="muted">
          Dez telas em linguagem simples para entender seu objetivo, sua percepção e quais dados realmente precisamos acompanhar.
        </p>
      </div>

      {!session ? (
        <section className="panel">
          <p>Você não precisa conhecer indicadores. Conte o que quer alcançar e o DuoMente organiza o que precisa ser medido.</p>
          <StartV3Diagnostic />
        </section>
      ) : !hasV3 && legacyAnswers.length > 0 ? (
        <section className="panel">
          <p className="eyebrow">HISTÓRICO PRESERVADO</p>
          <h2>Seu diagnóstico anterior continua intacto.</h2>
          <p>
            Encontramos {legacyAnswers.length} respostas do questionário anterior. Elas não serão apagadas nem convertidas automaticamente para o novo modelo.
          </p>
          <p>O novo diagnóstico será criado em uma sessão separada para permitir comparação posterior.</p>
          <StartV3Diagnostic label="Iniciar novo Diagnóstico v3" />
        </section>
      ) : hasV3 ? (
        <>
          {isFreshV3Session && preservedLegacyCount > 0 && (
            <p className="caption">Histórico preservado: {preservedLegacyCount} respostas anteriores permanecem intactas.</p>
          )}
          <progress value={v3Progress(v3Answers)} max={10} aria-label="Progresso do Diagnóstico v3" />
          {session.status === 'completed' || !q ? (
            <section className="panel">
              <p className="eyebrow">MAPA INICIAL · BASE DECLARADA</p>
              <h2>O ponto de partida foi confirmado.</h2>
              <p>
                As respostas foram preservadas como declarações e percepções. O próximo passo é transformar o que você quer alcançar em indicadores necessários e separar o que já temos do que ainda falta validar.
              </p>
              <details open>
                <summary>Respostas do Diagnóstico v3 ({v3Answers.length})</summary>
                {v3Answers.map((a) => (
                  <div className="list-row" key={a.id}>
                    <div>
                      <strong>{v3Questions.find((item) => item.id === a.question_id)?.title ?? a.question_id}</strong>
                      <p>{a.unknown ? 'Não sei / dado ainda ausente' : a.answer}</p>
                    </div>
                    <span className="badge">{a.unknown ? 'Dado ausente' : 'Dado declarado'}</span>
                  </div>
                ))}
              </details>
            </section>
          ) : (
            <DiagnosticV3Live
              key={q.id}
              sessionId={session.id}
              question={q}
              answers={v3Answers}
              readOnly={role === 'viewer'}
            />
          )}
        </>
      ) : (
        <section className="panel">
          <p>Vamos iniciar uma nova sessão do diagnóstico em linguagem simples.</p>
          <StartV3Diagnostic />
        </section>
      )}

      {role !== 'viewer' && (
        <details>
          <summary>Registrar uma evidência ou documento</summary>
          <EvidenceForm />
        </details>
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
