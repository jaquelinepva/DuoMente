import { type V3Answer, v3Questions } from '@/lib/diagnostic-v3';
import { answerStatus, buildInitialMap, displayV3Answer } from '@/lib/initial-map';

const perceptionScore: Record<string, number> = { Verde: 3, Amarelo: 2, Vermelho: 1, Cinza: 0 };
const perceptionText: Record<string, string> = {
  Verde: 'Você percebe esta parte da empresa como funcionando bem.',
  Amarelo: 'Você sente que esta parte merece atenção.',
  Vermelho: 'Você percebe um problema importante aqui.',
  Cinza: 'Você ainda não tem informação suficiente para avaliar.',
};

function PerceptionChart({ radar }: { radar: Array<{ label: string; perception: string }> }) {
  return (
    <div className="panel stack">
      <div>
        <p className="eyebrow">LEITURA VISUAL · SUA PERCEPÇÃO</p>
        <h3>Como você enxerga a empresa hoje</h3>
        <p className="muted">
          Este gráfico não é uma nota de desempenho. Ele apenas transforma suas respostas em uma leitura visual inicial. Os dados reais ainda serão conectados e validados.
        </p>
      </div>
      {radar.map((area) => {
        const score = perceptionScore[area.perception] ?? 0;
        const width = area.perception === 'Cinza' ? 8 : score === 1 ? 33 : score === 2 ? 66 : 100;
        return (
          <div key={area.label} className="stack" style={{ gap: '0.35rem' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{area.label}</strong>
              <span className="badge">{area.perception === 'Cinza' ? 'Não sei avaliar' : area.perception}</span>
            </div>
            <div aria-label={`${area.label}: ${area.perception}`} style={{ height: 12, borderRadius: 999, background: 'var(--border, #ddd)', overflow: 'hidden' }}>
              <div style={{ width: `${width}%`, height: '100%', borderRadius: 999, background: 'currentColor' }} />
            </div>
            <p className="caption">{perceptionText[area.perception] ?? 'Percepção ainda não informada.'}</p>
          </div>
        );
      })}
      <p><strong>Como ler:</strong> o gráfico mostra onde você acredita estar bem, onde sente atenção e onde ainda não sabe avaliar. No próximo passo, o DuoMente vai confrontar essa percepção com números reais.</p>
    </div>
  );
}

export function InitialMap({ answers }: { answers: V3Answer[] }) {
  const map = buildInitialMap(answers);
  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">MAPA INICIAL DE GESTÃO</p>
        <h2>Seu ponto de partida.</h2>
        <p>Agora vamos transformar suas respostas em uma leitura simples e descobrir quais números precisamos buscar.</p>
      </div>

      <PerceptionChart radar={map.radar} />

      <section className="panel">
        <p className="eyebrow">O QUE ISSO SIGNIFICA AGORA</p>
        <h3>O DuoMente ainda não está dando uma nota para sua empresa.</h3>
        <p>Primeiro registramos como você enxerga o negócio. Depois vamos buscar os dados necessários para verificar o que está realmente acontecendo e acompanhar sua meta.</p>
      </section>

      <section>
        <h3>Seu objetivo</h3>
        <p>{map.text('v3_p1_focus')}</p>
        <p>Meta declarada: {map.text('v3_p4_goal')}</p>
        <p>Prazo desejado: {map.text('v3_p5_deadline')}. A viabilidade ainda não foi avaliada.</p>
        <p>Bloqueios percebidos: {map.text('v3_p6_blockers')}.</p>
      </section>

      <section>
        <h3>O que já temos</h3>
        <p>Situação declarada: {map.text('v3_p2_example')}</p>
        <p>Impacto: {map.text('v3_p3_impact')}.</p>
        <p>Dados que você afirma acompanhar: {map.declaredData.join(', ') || 'Nenhum informado'}.</p>
        <p>Fonte declarada: {map.text('v3_p9_evidence')}.</p>
      </section>

      <section>
        <h3>O que precisamos descobrir</h3>
        <ul>
          {map.unknowns.map((a) => (
            <li key={a.question_id}>{v3Questions.find((q) => q.id === a.question_id)?.title} — a descobrir.</li>
          ))}
          {map.indicators.filter((i) => i.status === 'Faltante').map((i) => <li key={i.key}>{i.data}.</li>)}
          <li>Se os dados informados são confiáveis, atuais e comparáveis.</li>
        </ul>
      </section>

      <section>
        <h3>Os números que vão nos ajudar a decidir</h3>
        <p className="muted">O DuoMente escolheu estes pontos porque eles ajudam a entender seu objetivo. Você não precisa saber o nome técnico deles.</p>
        {map.indicators.length ? map.indicators.map((i) => (
          <div className="panel" key={i.key}>
            <h4>{i.name}</h4>
            <span className="badge">{i.status === 'Faltante' ? 'Precisamos deste dado' : 'Você disse que acompanha'}</span>
            <p>{i.why}</p>
            <p className="caption">Onde podemos buscar: {i.source}</p>
          </div>
        )) : <p>Precisamos esclarecer seu objetivo antes de escolher os números mais importantes.</p>}
      </section>

      {map.ambiguities.length > 0 && (
        <section>
          <h3>Antes de avançar, precisamos confirmar</h3>
          <ul>{map.ambiguities.map((a) => <li key={a}>{a}</li>)}</ul>
        </section>
      )}

      <details>
        <summary>Ver respostas do questionário</summary>
        {answers.filter((a) => a.question_id !== 'v3_p10_confirm').map((a) => (
          <div className="list-row" key={a.question_id}>
            <div><strong>{v3Questions.find((q) => q.id === a.question_id)?.title}</strong><p>{displayV3Answer(a)}</p></div>
            <span className="badge">{answerStatus(a)}</span>
          </div>
        ))}
      </details>
    </section>
  );
}
