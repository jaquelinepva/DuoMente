import Link from 'next/link';
import { context } from '@/lib/context';
import { nextV3Question, v3Progress, v3Questions, type V3Answer } from '@/lib/diagnostic-v3';
import { dateBR } from '@/lib/utils';
export default async function Home() {
  const { client, org, role } = await context();
  const [{ data: organization }, { data: sessions }, { data: decisions }, { data: actions }] =
    await Promise.all([
      client.from('organizations').select('name').eq('id', org).single(),
      client
        .from('diagnostic_sessions')
        .select('*')
        .eq('organization_id', org)
        .order('created_at', { ascending: false })
        .limit(5),
      client
        .from('decisions')
        .select('*')
        .eq('organization_id', org)
        .not('status', 'in', '(Concluída,Cancelada)')
        .order('created_at', { ascending: false }),
      client
        .from('action_items')
        .select('*')
        .eq('organization_id', org)
        .not('status', 'in', '(Concluída,Cancelada)')
        .order('due_date'),
    ]);
  let session: NonNullable<typeof sessions>[number] | undefined;
  let answers: V3Answer[] = [];
  for (const candidate of sessions ?? []) {
    const { data: rows, error } = await client
      .from('diagnostic_answers')
      .select('question_id,answer,unknown,is_draft')
      .eq('organization_id', org)
      .eq('session_id', candidate.id);
    if (error) throw new Error('Não foi possível carregar o progresso do diagnóstico.');
    if (!rows?.length || rows.some((a) => v3Questions.some((q) => q.id === a.question_id))) {
      session = candidate;
      answers = (rows ?? []).filter(
        (a) => !a.is_draft && v3Questions.some((q) => q.id === a.question_id),
      );
      break;
    }
  }
  const pending = nextV3Question(answers);
  const count = v3Questions.length;
  const answered = v3Progress(answers);
  const unknownCount = answers.filter((a) => a.unknown).length;
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">{organization?.name}</p>
        <h1>Clareza para o próximo passo.</h1>
        <p className="muted">O que precisa da sua atenção, em um só lugar.</p>
      </div>
      {role === 'viewer' && <p className="readonly">Seu acesso é somente leitura.</p>}
      <section className="next-action">
        <p className="eyebrow">PRÓXIMA AÇÃO</p>
        <h2>
          {!session
            ? 'Vamos entender o seu negócio.'
            : pending
              ? 'Continue seu diagnóstico.'
              : 'Seu Mapa Inicial está pronto.'}
        </h2>
        <p>
          {!session
            ? 'São 10 etapas para entender seu objetivo e o que precisamos descobrir.'
            : (pending?.title ??
              'Confira seu Mapa Inicial e as informações que ainda precisam ser validadas.')}
        </p>
        <Link className="button" href="/app/diagnostico">
          {!session
            ? 'Começar diagnóstico'
            : pending
              ? 'Continuar diagnóstico'
              : 'Ver Mapa Inicial'}{' '}
          →
        </Link>
      </section>
      <div className="split">
        <section className="panel">
          <h2>Diagnóstico</h2>
          <p>
            {answered} de {count} etapas concluídas
          </p>
          <progress value={answered} max={count} aria-label="Progresso do diagnóstico" />
          <p className="caption">
            O diagnóstico tem 10 etapas. Última atualização: {dateBR(session?.updated_at)}
          </p>
          <h3>Informações pendentes</h3>
          {unknownCount > 0 ? (
            <p>
              {unknownCount}{' '}
              {unknownCount === 1
                ? 'informação ainda a descobrir.'
                : 'informações ainda a descobrir.'}{' '}
              <Link href="/app/diagnostico">Ver informações pendentes</Link>
            </p>
          ) : (
            <p className="muted">
              {session
                ? 'Nenhuma resposta marcada como desconhecida até aqui.'
                : 'Inicie o diagnóstico para identificar as informações necessárias.'}
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Decisões que exigem atenção</h2>
          {decisions?.length ? (
            decisions.slice(0, 5).map((d) => (
              <div className="list-row" key={d.id}>
                <Link href={`/app/decisoes/${d.id}`}>{d.title}</Link>
                <span className="badge">{d.status}</span>
              </div>
            ))
          ) : (
            <p className="empty">Suas decisões aparecerão aqui quando forem registradas.</p>
          )}
        </section>
      </div>
      <section>
        <h2>Ações em andamento</h2>
        {actions?.length ? (
          actions.slice(0, 8).map((a) => (
            <div className="list-row" key={a.id}>
              <Link href="/app/acoes">{a.title}</Link>
              <span>
                {dateBR(a.due_date)} · {a.status}
              </span>
            </div>
          ))
        ) : (
          <p className="empty">
            Nenhuma ação em andamento. Depois do diagnóstico, defina seu primeiro passo.
          </p>
        )}
      </section>
    </>
  );
}
