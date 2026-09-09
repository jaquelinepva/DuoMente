import Link from 'next/link';
import { context } from '@/lib/context';
import { areas, questions, reportSchema } from '@/lib/domain';
export function AreaNavigation({ active }: { active?: number }) {
  return (
    <nav className="row" aria-label="Áreas da empresa">
      {areas.map((area, i) => (
        <Link
          key={area}
          className="button button-outline button-sm"
          aria-current={i === active ? 'page' : undefined}
          href={`/app/empresa?area=${i}`}
        >
          {area}
        </Link>
      ))}
    </nav>
  );
}
export async function AreaView({ index }: { index: number }) {
  const { client, org } = await context();
  const area = areas[index];
  const [{ data: sessions, error: sessionError }, { data: decisions, error: decisionError }] =
    await Promise.all([
      client
        .from('diagnostic_sessions')
        .select('id,report')
        .eq('organization_id', org)
        .order('created_at', { ascending: false })
        .limit(1),
      client
        .from('decisions')
        .select('id,title,status')
        .eq('organization_id', org)
        .eq('area', area),
    ]);
  if (sessionError || decisionError) throw new Error('Não foi possível carregar esta área.');
  const session = sessions?.[0];
  const { data: answers, error } = session
    ? await client
        .from('diagnostic_answers')
        .select('question_id,answer,unknown')
        .eq('organization_id', org)
        .eq('session_id', session.id)
        .eq('is_draft', false)
        .in('question_id', [`area_${index}`, `area_${index}_detail`, `area_${index}_evidence`])
    : { data: [], error: null };
  if (error) throw new Error('Não foi possível carregar as respostas.');
  const report = reportSchema.safeParse(session?.report);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">ÁREAS DA EMPRESA</p>
        <h1>{area}</h1>
        <AreaNavigation active={index} />
      </div>
      <section className="panel">
        <h2>O que você informou</h2>
        {answers?.length ? (
          answers.map((a) => (
            <article key={a.question_id}>
              <h3>{questions.find((q) => q.id === a.question_id)?.text}</h3>
              <p>{a.answer}</p>
              <span className="badge">{a.unknown ? 'Dado ausente' : 'Dado declarado'}</span>
            </article>
          ))
        ) : (
          <p>N/D — esta área ainda não tem respostas registradas.</p>
        )}
        <p>
          <Link href="/app/diagnostico">Continuar diagnóstico</Link>
        </p>
      </section>
      <section className="panel">
        <h2>Leitura executiva</h2>
        <p>
          {report.success
            ? report.data.area_analysis.find((a) => a.area === area)?.analysis
            : 'Ainda não há relatório validado para esta área.'}
        </p>
        <Link href="/app/diagnostico/relatorio">Revisar relatório completo</Link>
      </section>
      <section>
        <h2>Decisões relacionadas</h2>
        {decisions?.length ? (
          decisions.map((d) => (
            <div className="list-row" key={d.id}>
              <Link href={`/app/decisoes/${d.id}`}>{d.title}</Link>
              <span className="badge">{d.status}</span>
            </div>
          ))
        ) : (
          <p>Nenhuma decisão registrada nesta área.</p>
        )}
      </section>
    </>
  );
}
