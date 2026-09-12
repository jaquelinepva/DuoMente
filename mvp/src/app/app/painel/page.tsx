import { context } from '@/lib/context';
import { CompanyDashboard } from '@/components/company-dashboard';
import { displayV3Answer } from '@/lib/initial-map';
import { notFound } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; view?: string }>;
}) {
  const { area = 'financeiro', view = 'inteligencia' } = await searchParams;
  if (
    !['financeiro', 'marketing', 'operacoes', 'pessoas'].includes(area) ||
    !['inteligencia', 'metas', 'documentos', 'relatorios'].includes(view)
  )
    notFound();
  const { client, org } = await context();
  const [{ data: points, error }, { data: answers, error: answerError }] = await Promise.all([
    client
      .from('indicator_data_points')
      .select('indicator_key,value_text,period_label,status,source_type,source_label')
      .eq('organization_id', org)
      .order('created_at', { ascending: false }),
    client
      .from('diagnostic_answers')
      .select('question_id,answer,unknown')
      .eq('organization_id', org)
      .eq('question_id', 'v3_p4_goal')
      .eq('is_draft', false)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);
  if (error || answerError)
    throw new Error('Não foi possível carregar o painel da empresa. Tente novamente.');
  return (
    <CompanyDashboard
      initialArea={area}
      view={view}
      points={points ?? []}
      goal={answers?.[0] ? displayV3Answer(answers[0]) : undefined}
      documents={(points ?? []).filter((p) => p.source_type === 'file')}
    />
  );
}
