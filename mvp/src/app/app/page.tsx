import Link from 'next/link';
import { context } from '@/lib/context';
import { activeQuestions, nextQuestion } from '@/lib/domain';
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
        .limit(1),
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
  const session = sessions?.[0];
  const { data: answers } = session
    ? await client
        .from('diagnostic_answers')
        .select('question_id,answer,unknown')
        .eq('organization_id', org)
        .eq('session_id', session.id)
        .eq('is_draft', false)
    : { data: [] };
  const pending = nextQuestion(answers ?? []);
  const count = activeQuestions(answers ?? []).length;
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
              : session.status !== 'completed'
                ? 'Revise e confirme seu diagnóstico.'
                : actions?.length
                  ? 'Avance nas ações combinadas.'
                  : 'Transforme prioridades em decisões.'}
        </h2>
        <p>
          {!session
            ? 'Antes de mostrar números, vamos entender o seu negócio e descobrir quais decisões precisam da sua atenção.'
            : (pending?.text ?? 'As conclusões relevantes passam pela sua revisão.')}
        </p>
        <Link
          className="button"
          href={
            !session || pending
              ? '/app/diagnostico'
              : session.status !== 'completed'
                ? '/app/diagnostico/relatorio'
                : actions?.length
                  ? '/app/acoes'
                  : '/app/decisoes'
          }
        >
          {!session ? 'Começar diagnóstico' : 'Ver próximo passo'} →
        </Link>
      </section>
      <div className="split">
        <section className="panel">
          <h2>Diagnóstico</h2>
          <p>
            {answers?.length ?? 0} de {count} perguntas do percurso atual respondidas
          </p>
          <progress
            value={answers?.length ?? 0}
            max={count}
            aria-label="Progresso do diagnóstico"
          />
          <p className="caption">
            O percurso se adapta às suas respostas. Última atualização:{' '}
            {dateBR(session?.updated_at)}
          </p>
          <h3>Informações pendentes</h3>
          {answers?.filter((a) => a.unknown).length ? (
            <p>
              {answers.filter((a) => a.unknown).length} respostas registradas como N/D.{' '}
              <Link href="/app/diagnostico">Registrar evidências</Link>
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
