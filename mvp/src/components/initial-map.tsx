import { type V3Answer, v3Questions } from '@/lib/diagnostic-v3';
import { answerStatus, buildInitialMap, displayV3Answer } from '@/lib/initial-map';
import { IndicatorDataForm } from '@/components/indicator-data-form';

const perceptionText: Record<string, string> = {
  Verde: 'Na sua percepção, está funcionando bem.',
  Amarelo: 'Na sua percepção, merece atenção.',
  Vermelho: 'Na sua percepção, existe um problema importante.',
  Cinza: 'Você ainda não sabe avaliar.',
};
const perceptionWidth: Record<string, number> = { Verde: 100, Amarelo: 66, Vermelho: 33, Cinza: 8 };
const perceptionColor: Record<string, string> = { Verde: '#2f855a', Amarelo: '#d69e2e', Vermelho: '#c53030', Cinza: '#a0aec0' };

type DataPoint = {
  indicator_key: string;
  source_type: string;
  source_label: string | null;
  value_text: string | null;
  period_label: string | null;
  status: string;
  validated_at: string | null;
};

function PerceptionChart({ radar }: { radar: Array<{ label: string; perception: string }> }) {
  return <section className="panel stack">
    <div><p className="eyebrow">1 · COMO VOCÊ ENXERGA A EMPRESA HOJE</p><h3>Seu primeiro retrato</h3><p className="muted">Não é uma nota. É a sua percepção inicial. Conforme os dados entrarem, o DuoMente vai mostrar ao lado o que os números realmente indicam.</p></div>
    {radar.map((area) => <div key={area.label} className="stack" style={{ gap: '.35rem' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}><strong>{area.label}</strong><span className="badge">{area.perception === 'Cinza' ? 'Não sei avaliar' : area.perception}</span></div>
      <div style={{ height: 14, borderRadius: 999, background: '#e8e4dc', overflow: 'hidden' }} aria-label={`${area.label}: ${area.perception}`}><div style={{ width: `${perceptionWidth[area.perception] ?? 8}%`, height: '100%', borderRadius: 999, background: perceptionColor[area.perception] ?? '#a0aec0' }} /></div>
      <p className="caption">{perceptionText[area.perception]}</p>
    </div>)}
    <p><strong>Como ler:</strong> isto mostra onde você sente segurança, atenção ou dúvida. Ainda não usamos esses sinais para julgar o desempenho da empresa.</p>
  </section>;
}

function StatusSummary({ declared, received, missing }: { declared: number; received: number; missing: number }) {
  const total = declared + received + missing;
  return <section className="panel stack">
    <p className="eyebrow">3 · O QUE JÁ TEMOS</p>
    <h3>{received} de {total || 0} informações importantes já têm valor recebido</h3>
    <div className="grid-2">
      <div className="panel"><strong>Valor recebido</strong><p>{received}</p><p className="caption">O valor chegou ao DuoMente, mas ainda pode precisar de validação.</p></div>
      <div className="panel"><strong>Só fonte declarada</strong><p>{declared}</p><p className="caption">Você disse que acompanha, mas o valor ainda não foi enviado.</p></div>
      <div className="panel"><strong>Sem fonte</strong><p>{missing}</p><p className="caption">Ainda precisamos descobrir de onde virá.</p></div>
    </div>
  </section>;
}

export function InitialMap({ answers, sessionId, readOnly, dataPoints }: { answers: V3Answer[]; sessionId: string; readOnly: boolean; dataPoints: DataPoint[] }) {
  const map = buildInitialMap(answers);
  const pointByKey = new Map<string, DataPoint>();
  for (const point of dataPoints) if (!pointByKey.has(point.indicator_key)) pointByKey.set(point.indicator_key, point);
  const received = map.indicators.filter((i) => pointByKey.has(i.key)).length;
  const declared = map.indicators.filter((i) => !pointByKey.has(i.key) && i.status === 'Fonte declarada — valor não recebido').length;
  const missing = map.indicators.filter((i) => !pointByKey.has(i.key) && i.status === 'Sem fonte declarada').length;
  const missingLabel = missing === 1 ? 'informação importante' : 'informações importantes';

  return <section className="stack"><section className="panel stack">
    <div><p className="eyebrow">MAPA INICIAL DUOMENTE</p><h2>Agora você já tem um ponto de partida.</h2><p>Não precisa interpretar o questionário. O DuoMente vai transformar suas respostas em objetivo, sinais visuais, informações necessárias e próximos passos.</p></div>

    <section className="panel"><p className="eyebrow">SEU FOCO</p><h3>{map.text('v3_p1_focus')}</h3><p><strong>Meta:</strong> {map.text('v3_p4_goal')}</p><p><strong>Prazo:</strong> {map.text('v3_p5_deadline')}</p><p><strong>O que mais pode estar travando:</strong> {map.text('v3_p6_blockers')}</p></section>

    <PerceptionChart radar={map.radar} />

    <section className="panel"><p className="eyebrow">2 · O QUE VOCÊ NOS CONTOU</p><h3>O cenário que vamos investigar</h3><p><strong>Situação:</strong> {map.text('v3_p2_example')}</p><p><strong>Impacto:</strong> {map.text('v3_p3_impact')}</p><p><strong>Fonte disponível:</strong> {map.text('v3_p9_evidence')}</p></section>

    <StatusSummary declared={declared} received={received} missing={missing} />

    <section><p className="eyebrow">4 · OS NÚMEROS QUE VÃO NOS AJUDAR</p><h3>Agora podemos começar a trazer os valores</h3><p className="muted">O DuoMente escolheu estes números porque eles ajudam a responder se você está avançando em direção à sua meta.</p>
      <div className="grid-2">{map.indicators.length ? map.indicators.map((i) => {
        const point = pointByKey.get(i.key);
        return <article className="panel stack" key={i.key}>
          <span className="badge">{point ? (point.status === 'validated' ? 'Validado' : 'Valor recebido · aguardando validação') : i.status === 'Sem fonte declarada' ? 'Precisamos descobrir a fonte' : 'Fonte declarada · valor ainda não recebido'}</span>
          <h4>{i.name}</h4><p>{i.why}</p>
          {point ? <div><p><strong>Valor recebido:</strong> {point.value_text}</p><p><strong>Período:</strong> {point.period_label}</p><p className="caption">Origem: {point.source_label ?? point.source_type}</p></div> : <><p className="caption">Onde podemos buscar: {i.source}</p>{!readOnly && <IndicatorDataForm sessionId={sessionId} indicatorKey={i.key} label={i.name} />}</>}
        </article>;
      }) : <p>Precisamos esclarecer melhor seu objetivo antes de escolher os números mais importantes.</p>}</div>
    </section>

    <section className="panel"><p className="eyebrow">5 · PRÓXIMO PASSO</p><h3>Agora vamos transformar percepção em dados.</h3>
      {missing > 0 ? <p>{missing === 1 ? 'Existe' : 'Existem'} {missing} {missingLabel} ainda sem uma fonte declarada. Você já pode informar manualmente um valor conhecido; depois adicionaremos envio de arquivo e conexões automáticas.</p> : received < map.indicators.length ? <p>Já sabemos onde buscar os principais números. Agora precisamos receber os valores que faltam antes de usá-los em decisões.</p> : <p>Os principais valores identificados já foram recebidos. O próximo passo será validar esses dados antes de transformar isso em recomendação.</p>}
      <p><strong>Regra:</strong> valor recebido não significa valor validado. O DuoMente mantém essa diferença visível para evitar decisões sobre dados incertos.</p>
    </section>

    {map.ambiguities.length > 0 && <section className="panel"><p className="eyebrow">PRECISAMOS CONFIRMAR</p><ul>{map.ambiguities.map((a) => <li key={a}>{a}</li>)}</ul></section>}

    <details><summary>Ver detalhes e respostas do questionário</summary><p><strong>Dados que você afirma acompanhar:</strong> {map.declaredData.join(', ') || 'Nenhum informado'}.</p>{map.unknowns.length > 0 && <><h4>Ainda não sabemos</h4><ul>{map.unknowns.map((a) => <li key={a.question_id}>{v3Questions.find((q) => q.id === a.question_id)?.title} — a descobrir.</li>)}</ul></>}{answers.filter((a) => a.question_id !== 'v3_p10_confirm').map((a) => <div className="list-row" key={a.question_id}><div><strong>{v3Questions.find((q) => q.id === a.question_id)?.title}</strong><p>{displayV3Answer(a)}</p></div><span className="badge">{answerStatus(a)}</span></div>)}</details>
  </section></section>;
}
