import { type V3Answer, v3Questions } from '@/lib/diagnostic-v3';
import { answerStatus, buildInitialMap, displayV3Answer } from '@/lib/initial-map';

const perceptionText: Record<string, string> = {
  Verde: 'Na sua percepção, está funcionando bem.',
  Amarelo: 'Na sua percepção, merece atenção.',
  Vermelho: 'Na sua percepção, existe um problema importante.',
  Cinza: 'Você ainda não sabe avaliar.',
};
const perceptionWidth: Record<string, number> = { Verde: 100, Amarelo: 66, Vermelho: 33, Cinza: 8 };

function PerceptionChart({ radar }: { radar: Array<{ label: string; perception: string }> }) {
  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">1 · COMO VOCÊ ENXERGA A EMPRESA HOJE</p>
        <h3>Seu primeiro retrato</h3>
        <p className="muted">Não é uma nota. É a sua percepção inicial. Conforme os dados entrarem, o DuoMente vai mostrar ao lado o que os números realmente indicam.</p>
      </div>
      {radar.map((area) => (
        <div key={area.label} className="stack" style={{ gap: '.35rem' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{area.label}</strong>
            <span className="badge">{area.perception === 'Cinza' ? 'Não sei avaliar' : area.perception}</span>
          </div>
          <div style={{ height: 14, borderRadius: 999, background: '#e8e4dc', overflow: 'hidden' }} aria-label={`${area.label}: ${area.perception}`}>
            <div style={{ width: `${perceptionWidth[area.perception] ?? 8}%`, height: '100%', borderRadius: 999, background: 'currentColor' }} />
          </div>
          <p className="caption">{perceptionText[area.perception]}</p>
        </div>
      ))}
      <p><strong>Como ler:</strong> isto mostra onde você sente segurança, atenção ou dúvida. Ainda não usamos esses sinais para julgar o desempenho da empresa.</p>
    </section>
  );
}

function StatusSummary({ available, missing }: { available: number; missing: number }) {
  const total = available + missing;
  const pct = total ? Math.round((available / total) * 100) : 0;
  return (
    <section className="panel stack">
      <p className="eyebrow">3 · O QUE JÁ CONSEGUIMOS MEDIR</p>
      <h3>{available} de {total || 0} números importantes já foram informados</h3>
      <div style={{ height: 16, borderRadius: 999, background: '#e8e4dc', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'currentColor' }} />
      </div>
      <p className="muted">Isso não significa que {pct}% da empresa está bem. Significa apenas quanto da informação necessária para decidir já está disponível para validação.</p>
    </section>
  );
}

export function InitialMap({ answers }: { answers: V3Answer[] }) {
  const map = buildInitialMap(answers);
  const available = map.indicators.filter((i) => i.status !== 'Faltante').length;
  const missing = map.indicators.filter((i) => i.status === 'Faltante').length;
  return (
    <section className="stack">
      <section className="panel stack">
        <div>
          <p className="eyebrow">MAPA INICIAL DUOMENTE</p>
          <h2>Agora você já tem um ponto de partida.</h2>
          <p>Não precisa interpretar o questionário. O DuoMente vai transformar suas respostas em objetivo, sinais visuais, números necessários e próximos passos.</p>
        </div>

        <section className="panel">
          <p className="eyebrow">SEU FOCO</p>
          <h3>{map.text('v3_p1_focus')}</h3>
          <p><strong>Meta:</strong> {map.text('v3_p4_goal')}</p>
          <p><strong>Prazo:</strong> {map.text('v3_p5_deadline')}</p>
          <p><strong>O que mais pode estar travando:</strong> {map.text('v3_p6_blockers')}</p>
        </section>

        <PerceptionChart radar={map.radar} />

        <section className="panel">
          <p className="eyebrow">2 · O QUE VOCÊ NOS CONTOU</p>
          <h3>O cenário que vamos investigar</h3>
          <p><strong>Situação:</strong> {map.text('v3_p2_example')}</p>
          <p><strong>Impacto:</strong> {map.text('v3_p3_impact')}</p>
          <p><strong>Fonte disponível:</strong> {map.text('v3_p9_evidence')}</p>
        </section>

        <StatusSummary available={available} missing={missing} />

        <section>
          <p className="eyebrow">4 · OS NÚMEROS QUE VÃO NOS AJUDAR</p>
          <h3>Você não precisa saber o nome técnico deles</h3>
          <p className="muted">O DuoMente escolheu estes números porque eles ajudam a responder se você está avançando em direção à sua meta.</p>
          <div className="grid-2">
            {map.indicators.length ? map.indicators.map((i) => (
              <article className="panel" key={i.key}>
                <span className="badge">{i.status === 'Faltante' ? 'Precisamos buscar' : 'Você disse que acompanha'}</span>
                <h4>{i.name}</h4>
                <p>{i.why}</p>
                <p className="caption">Podemos buscar em: {i.source}</p>
              </article>
            )) : <p>Precisamos esclarecer melhor seu objetivo antes de escolher os números mais importantes.</p>}
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">5 · PRÓXIMO PASSO</p>
          <h3>Agora vamos transformar percepção em dados.</h3>
          {missing > 0 ? (
            <p>Existem {missing} informações importantes que ainda precisamos buscar. Comece pelas fontes que você já possui; depois o DuoMente poderá conectar sistemas e acompanhar esses números continuamente.</p>
          ) : (
            <p>Você declarou acompanhar os principais números identificados. O próximo passo é validar os valores e períodos para começar o acompanhamento.</p>
          )}
          <p><strong>Primeira regra:</strong> ainda não vamos recomendar ações estratégicas só com base na sua percepção. Primeiro validamos os dados que podem mudar a decisão.</p>
        </section>

        {map.ambiguities.length > 0 && (
          <section className="panel">
            <p className="eyebrow">PRECISAMOS CONFIRMAR</p>
            <ul>{map.ambiguities.map((a) => <li key={a}>{a}</li>)}</ul>
          </section>
        )}

        <details>
          <summary>Ver detalhes e respostas do questionário</summary>
          <p><strong>Dados que você afirma acompanhar:</strong> {map.declaredData.join(', ') || 'Nenhum informado'}.</p>
          {map.unknowns.length > 0 && <><h4>Ainda não sabemos</h4><ul>{map.unknowns.map((a) => <li key={a.question_id}>{v3Questions.find((q) => q.id === a.question_id)?.title} — a descobrir.</li>)}</ul></>}
          {answers.filter((a) => a.question_id !== 'v3_p10_confirm').map((a) => (
            <div className="list-row" key={a.question_id}>
              <div><strong>{v3Questions.find((q) => q.id === a.question_id)?.title}</strong><p>{displayV3Answer(a)}</p></div>
              <span className="badge">{answerStatus(a)}</span>
            </div>
          ))}
        </details>
      </section>
    </section>
  );
}
