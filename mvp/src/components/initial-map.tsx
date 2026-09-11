import { type V3Answer, v3Questions } from '@/lib/diagnostic-v3';
import { answerStatus, buildInitialMap, displayV3Answer } from '@/lib/initial-map';

export function InitialMap({ answers }: { answers: V3Answer[] }) {
  const map = buildInitialMap(answers);
  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">MAPA INICIAL DE GESTÃO</p>
        <h2>Seu objetivo e o que precisamos descobrir.</h2>
        <p>
          O resumo foi confirmado por você. Os números e as percepções ainda precisam de validação.
        </p>
      </div>
      <section>
        <h3>Objetivo global declarado</h3>
        <p>{map.text('v3_p1_focus')}</p>
        <p>{map.text('v3_p4_goal')}</p>
        <p>Prazo desejado: {map.text('v3_p5_deadline')}. A viabilidade ainda não foi avaliada.</p>
        <p>
          {map.gap === null
            ? 'Diferença para a meta: ainda não calculável com segurança.'
            : `Diferença entre os valores declarados: ${map.gap.toLocaleString('pt-BR')} ${map.goal?.unit} ${map.goal?.period}.`}
        </p>
        <p>Bloqueios percebidos: {map.text('v3_p6_blockers')}. Ainda não são causas comprovadas.</p>
      </section>
      <section>
        <h3>Percepção inicial do empresário</h3>
        <div className="grid-2">
          {map.radar.map((area) => (
            <div className="panel" key={area.label}>
              <strong>{area.label}</strong>
              <p>Percepção: {area.perception === 'Cinza' ? 'Não sei avaliar' : area.perception}</p>
              <p className="muted">Situação baseada em dados: dados insuficientes</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3>O que sabemos</h3>
        <p>Fatos validados: nenhum nesta sessão. Confirmar respostas não comprova os dados.</p>
        <p>Relato declarado: {map.text('v3_p2_example')}</p>
        <p>Impacto: {map.text('v3_p3_impact')}.</p>
        <p>
          Dados que você afirma acompanhar: {map.declaredData.join(', ') || 'Nenhum informado'}.
        </p>
        <p>
          Fonte declarada: {map.text('v3_p9_evidence')}. O conteúdo da fonte ainda não foi
          analisado.
        </p>
        <p>Valores informados para o impacto permanecem estimativas declaradas.</p>
      </section>
      <section>
        <h3>O que ainda não sabemos</h3>
        <ul>
          {map.unknowns.map((a) => (
            <li key={a.question_id}>
              {v3Questions.find((q) => q.id === a.question_id)?.title} — a descobrir.
            </li>
          ))}
          {map.indicators
            .filter((i) => i.status === 'Faltante')
            .map((i) => (
              <li key={i.key}>{i.data}.</li>
            ))}
          <li>Confiabilidade, período e conteúdo dos dados declarados.</li>
        </ul>
      </section>
      <section>
        <h3>Ambiguidades e conflitos</h3>
        {map.ambiguities.length ? (
          <ul>
            {map.ambiguities.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : (
          <p>
            Nenhuma ambiguidade detectada pelas verificações disponíveis. Isso não valida as
            respostas.
          </p>
        )}
      </section>
      <section>
        <h3>O que precisamos acompanhar</h3>
        <p>
          Indicadores sugeridos a partir do objetivo e dos bloqueios percebidos; ainda sem valores
          comprovados.
        </p>
        {map.indicators.length ? (
          map.indicators.map((i) => (
            <div className="panel" key={i.key}>
              <h4>{i.name}</h4>
              <span className="badge">{i.status}</span>
              <p>{i.why}</p>
              <p>
                Área: {i.area} · Dado necessário: {i.data}
              </p>
              <p>Fonte possível: {i.source}</p>
            </div>
          ))
        ) : (
          <p>Precisamos esclarecer o objetivo principal para escolher os indicadores relevantes.</p>
        )}
      </section>
      <details>
        <summary>Revisar respostas confirmadas</summary>
        {answers
          .filter((a) => a.question_id !== 'v3_p10_confirm')
          .map((a) => (
            <div className="list-row" key={a.question_id}>
              <div>
                <strong>{v3Questions.find((q) => q.id === a.question_id)?.title}</strong>
                <p>{displayV3Answer(a)}</p>
              </div>
              <span className="badge">{answerStatus(a)}</span>
            </div>
          ))}
      </details>
    </section>
  );
}
