import { context } from '@/lib/context';
import { isV3QuestionId, nextV3Question, v3Progress } from '@/lib/diagnostic-v3';
import { DiagnosticV3Live } from '@/components/diagnostic-v3-live';
import { InitialMap } from '@/components/initial-map';
import { StartV3Diagnostic } from '@/components/start-v3-diagnostic';

export default async function Page() {
  const { client, org, role } = await context();
  const { data: sessions } = await client
    .from('diagnostic_sessions')
    .select('*')
    .eq('organization_id', org)
    .order('created_at', { ascending: false })
    .limit(5);

  let session: (typeof sessions extends Array<infer T> | null ? T : never) | undefined;
  let answers: Array<{
    id: string;
    question_id: string;
    answer: string;
    unknown: boolean;
    is_draft: boolean;
  }> = [];

  // A interface v3 ignora completamente sessões legadas. Elas continuam no banco apenas
  // para auditoria/comparação e nunca mais são exibidas ao empresário.
  for (const candidate of sessions ?? []) {
    const { data: candidateAnswers } = await client
      .from('diagnostic_answers')
      .select('id,question_id,answer,unknown,is_draft')
      .eq('organization_id', org)
      .eq('session_id', candidate.id)
      .order('created_at');
    const rows = candidateAnswers ?? [];
    if (rows.length === 0 || rows.some((a) => isV3QuestionId(a.question_id))) {
      session = candidate;
      answers = rows;
      break;
    }
  }

  const completed = answers.filter((a) => !a.is_draft && isV3QuestionId(a.question_id));
  const q = session ? nextV3Question(completed) : undefined;

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">DIAGNÓSTICO DUOMENTE</p>
        <h1>Vamos entender o que precisa mudar agora.</h1>
        <p className="muted">
          São 10 etapas simples. Você não precisa conhecer indicadores, gestão ou termos técnicos.
        </p>
      </div>

      {!session ? (
        <section className="panel">
          <h2>Comece pelo que mais importa nos próximos 30 dias.</h2>
          <p>Conte o que quer alcançar. O DuoMente vai descobrir o que precisa ser medido.</p>
          <StartV3Diagnostic label="Começar diagnóstico" />
        </section>
      ) : (
        <>
          <progress value={v3Progress(completed)} max={10} aria-label="Progresso do diagnóstico" />
          {session.status === 'completed' || !q ? (
            <>
              <InitialMap answers={completed} />
              {role !== 'viewer' && (
                <section className="panel">
                  <h2>Quer fazer um novo diagnóstico?</h2>
                  <p>
                    Comece novamente pela pergunta 1. As respostas anteriores ficam preservadas no
                    histórico.
                  </p>
                  <StartV3Diagnostic label="Iniciar novo diagnóstico" />
                </section>
              )}
            </>
          ) : (
            <DiagnosticV3Live
              key={q.id}
              sessionId={session.id}
              question={q}
              answers={completed}
              readOnly={role === 'viewer'}
            />
          )}
        </>
      )}
    </>
  );
}
