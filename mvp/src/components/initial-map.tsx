'use client';

import { useState } from 'react';
import { type V3Answer, v3Questions } from '@/lib/diagnostic-v3';
import { answerStatus, buildInitialMap, displayV3Answer } from '@/lib/initial-map';
import {
  dashboardIndicators,
  isTestRecord,
  statusLabels,
  type DataPoint,
  type DataState,
} from '@/lib/dashboard';
import { IndicatorDataForm } from '@/components/indicator-data-form';
import { IndicatorFileForm } from '@/components/indicator-file-form';
import styles from './initial-map.module.css';

const stateShort: Record<DataState, string> = {
  validated: 'Validados',
  received: 'Valores recebidos',
  file: 'Arquivos sem leitura',
  declared: 'Só fonte declarada',
  missing: 'Sem informação',
};
const stateOrder: DataState[] = ['validated', 'received', 'file', 'declared', 'missing'];
const perception: Record<string, string> = {
  Verde: 'Funciona bem',
  Amarelo: 'Merece atenção',
  Vermelho: 'Problema percebido',
  Cinza: 'Não sei avaliar',
};
const marks: Record<string, string> = { Verde: '●', Amarelo: '◐', Vermelho: '!', Cinza: '?' };
const tabs = ['Painel', 'Qualidade dos dados', 'Suas respostas'] as const;
type Indicator = ReturnType<typeof dashboardIndicators>[number];

function RecordsChart({ indicator }: { indicator: Indicator }) {
  const [record, setRecord] = useState(0);
  const series = indicator.numeric;
  const selected = series[record] ?? series[0];
  const units = new Set(series.map((r) => r.parsed!.unit));
  if (!series.length || units.size > 1)
    return (
      <div className={styles.emptyChart}>
        <svg
          viewBox="0 0 560 150"
          role="img"
          aria-label="Gráfico indisponível: dados insuficientes"
        >
          {[35, 75, 115].map((y) => (
            <line
              key={y}
              x1="30"
              x2="535"
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeDasharray="4 7"
              opacity=".18"
            />
          ))}
          <path d="M30 15V130H535" fill="none" stroke="currentColor" opacity=".25" />
          <rect
            x="214"
            y="38"
            width="130"
            height="57"
            rx="9"
            fill="white"
            stroke="currentColor"
            strokeDasharray="5 5"
            opacity=".6"
          />
          <text x="279" y="76" textAnchor="middle" fontSize="24" fill="currentColor">
            —
          </text>
        </svg>
        <strong>
          {units.size > 1
            ? 'Unidades diferentes'
            : indicator.values.length
              ? 'O valor precisa ser esclarecido'
              : 'Este gráfico ainda não tem dados'}
        </strong>
        <p>
          {units.size > 1
            ? 'Os registros usam unidades diferentes e não podem compartilhar a mesma escala.'
            : 'Mostraremos apenas valores recebidos. Nenhuma barra foi preenchida com estimativas.'}
        </p>
      </div>
    );
  const max = Math.max(...series.map((r) => Math.abs(r.parsed!.value)), 1);
  const hasNegative = series.some((r) => r.parsed!.value < 0);
  const base = hasNegative ? 280 : 45;
  const length = hasNegative ? 225 : 450;
  const height = 55 + series.length * 50;
  const endLabel = max.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  return (
    <div className={styles.records}>
      <div className={styles.chartCaption}>
        <span>Registros recebidos · {series[0].parsed!.unit || 'unidade não informada'}</span>
        <span>Selecione uma barra</span>
      </div>
      <svg
        viewBox={`0 0 560 ${height}`}
        role="group"
        aria-label={`Gráfico dos valores informados: ${indicator.name}`}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={base + length * t}
              x2={base + length * t}
              y1="12"
              y2={height - 24}
              stroke="#dbe4e8"
              strokeDasharray="3 5"
            />
            <text
              x={base + length * t}
              y={height - 5}
              textAnchor="middle"
              fill="#647480"
              fontSize="11"
            >
              {t === 0
                ? '0'
                : t === 1
                  ? endLabel
                  : (max / 2).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
            </text>
          </g>
        ))}
        {hasNegative && (
          <text x="55" y={height - 5} fill="#647480" fontSize="11">
            −{endLabel}
          </text>
        )}
        {series.map((r, index) => {
          const width = (Math.abs(r.parsed!.value) / max) * length;
          const x = r.parsed!.value < 0 ? base - width : base;
          const test = isTestRecord(r.point);
          const fill = test
            ? '#b06b30'
            : r.point.status === 'validated' && r.point.validated_at
              ? '#23766e'
              : '#387bbb';
          return (
            <g
              key={index}
              role="button"
              tabIndex={0}
              aria-label={`Registro ${index + 1}: ${r.point.value_text}, ${r.point.period_label || 'período ausente'}${test ? ', teste fictício' : ''}`}
              aria-pressed={record === index}
              onClick={() => setRecord(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setRecord(index);
                }
              }}
              className={styles.bar}
            >
              <title>
                {r.point.period_label || 'Período não informado'}: {r.point.value_text}
              </title>
              <rect
                x="0"
                y={index * 50 + 12}
                width="560"
                height="40"
                rx="5"
                fill={record === index ? '#eef4f8' : 'transparent'}
              />
              <text x="12" y={index * 50 + 38} fontSize="12" fill="#526879">
                {index + 1}
              </text>
              {r.parsed!.value === 0 ? (
                <circle cx={base} cy={index * 50 + 32} r="4" fill={fill} />
              ) : (
                <rect
                  x={x}
                  y={index * 50 + 20}
                  width={width}
                  height="24"
                  rx="4"
                  fill={fill}
                  opacity={record === index ? 1 : 0.55}
                />
              )}
            </g>
          );
        })}
      </svg>
      {selected && (
        <div className={styles.recordInfo} aria-live="polite">
          <strong>{selected.point.value_text}</strong>
          <span>{selected.point.period_label || 'Período não informado'}</span>
          {isTestRecord(selected.point) && <b className={styles.warning}>Teste fictício</b>}
        </div>
      )}
      <p className={styles.note}>
        {series.length === 1
          ? 'Um registro isolado. Ainda não é possível mostrar evolução.'
          : 'Cada barra é um registro, na ordem de recebimento. Não é uma série temporal.'}
      </p>
    </div>
  );
}

export function InitialMap({
  answers,
  sessionId,
  readOnly,
  dataPoints,
}: {
  answers: V3Answer[];
  sessionId: string;
  readOnly: boolean;
  dataPoints: DataPoint[];
}) {
  const map = buildInitialMap(answers);
  const indicators = dashboardIndicators(answers, dataPoints);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Painel');
  const [selectedKey, setSelectedKey] = useState<string>(indicators[0]?.key ?? '');
  const [filter, setFilter] = useState<DataState | 'all'>('all');
  const filtered = indicators.filter((i) => filter === 'all' || i.state === filter);
  const selected = filtered.find((i) => i.key === selectedKey) ?? filtered[0];
  const count = (state: DataState) => indicators.filter((i) => i.state === state).length;
  const received = indicators.filter((i) => i.values.length).length;
  const ready = indicators.filter((i) => i.ready).length;
  function inspect(key: string) {
    setFilter('all');
    setSelectedKey(key);
    setTab('Painel');
  }
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MAPA INICIAL · SUAS INFORMAÇÕES</p>
          <h1>O que já dá para enxergar.</h1>
          <p>Seus registros, as lacunas e o próximo dado a buscar.</p>
        </div>
        <span className={styles.sessionTag}>10 etapas respondidas</span>
      </header>
      <section className={styles.goal} aria-label="Objetivo informado">
        <div>
          <span className={styles.label}>Seu foco</span>
          <h2>{map.text('v3_p1_focus')}</h2>
        </div>
        <div>
          <span className={styles.label}>Meta declarada</span>
          <strong>{map.text('v3_p4_goal')}</strong>
        </div>
        <div>
          <span className={styles.label}>Prazo desejado</span>
          <strong>{map.text('v3_p5_deadline')}</strong>
        </div>
        <div className={styles.goalNote}>
          Comparação com a meta pendente de valores, unidade e período compatíveis.
        </div>
      </section>
      <div className={styles.tabs} role="group" aria-label="Visões do dashboard">
        {tabs.map((t) => (
          <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
            {t === 'Qualidade dos dados' && (
              <span>{indicators.filter((i) => !i.ready).length}</span>
            )}
          </button>
        ))}
      </div>
      {tab !== 'Suas respostas' && (
        <section className={styles.coverage} aria-label="Cobertura das informações">
          <div className={styles.sectionTop}>
            <div>
              <h2>Quanto do seu cenário está visível?</h2>
              <p>
                {received} de {indicators.length} indicadores com valor recebido · {ready} prontos
                para análise
              </p>
            </div>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => {
                setFilter('all');
                setTab('Qualidade dos dados');
              }}
            >
              Ver lacunas ↗
            </button>
          </div>
          <div
            className={styles.coverageTrack}
            role="group"
            aria-label="Distribuição dos indicadores por situação"
          >
            {stateOrder
              .filter((s) => count(s))
              .map((s) => (
                <button
                  type="button"
                  key={s}
                  data-state={s}
                  style={{ flex: count(s) }}
                  onClick={() => {
                    setFilter(filter === s ? 'all' : s);
                    setTab('Painel');
                  }}
                  aria-label={`${count(s)} ${stateShort[s]}. Filtrar indicadores`}
                  aria-pressed={filter === s}
                >
                  <span>{count(s)}</span>
                </button>
              ))}
            {!indicators.length && <span>Nenhum indicador definido</span>}
          </div>
          <div className={styles.legend}>
            {stateOrder.map((s) => (
              <button
                type="button"
                key={s}
                aria-pressed={filter === s}
                onClick={() => {
                  setFilter(filter === s ? 'all' : s);
                  setTab('Painel');
                }}
              >
                <i data-state={s} />
                {stateShort[s]} <b>{count(s)}</b>
              </button>
            ))}
            {filter !== 'all' && (
              <button type="button" onClick={() => setFilter('all')}>
                Limpar filtro ×
              </button>
            )}
          </div>
        </section>
      )}
      {tab === 'Painel' && (
        <>
          <div className={styles.mainGrid}>
            <section className={styles.card} aria-label="Explorar indicadores">
              <div className={styles.sectionTop}>
                <h2>Seus números</h2>
                <span className={styles.small}>Valores originais</span>
              </div>
              <div className={styles.indicatorTabs} role="group" aria-label="Escolher indicador">
                {filtered.map((i) => (
                  <button
                    key={i.key}
                    type="button"
                    aria-pressed={selected?.key === i.key}
                    onClick={() => setSelectedKey(i.key)}
                  >
                    <span>{i.name}</span>
                    <small>
                      {i.values.length
                        ? `${i.values.length} registro${i.values.length === 1 ? '' : 's'}`
                        : 'Sem valor'}
                    </small>
                  </button>
                ))}
              </div>
              {selected ? (
                <>
                  <div className={styles.chartTitle}>
                    <h3>{selected.name}</h3>
                    <span className={styles.pill} data-state={selected.state}>
                      {statusLabels[selected.state]}
                    </span>
                  </div>
                  <RecordsChart key={selected.key} indicator={selected} />
                  {selected.conflicts.length > 0 && (
                    <p className={styles.alert}>
                      Valores conflitantes para o mesmo período. Consulte os registros antes de
                      comparar.
                    </p>
                  )}
                </>
              ) : (
                <div className={styles.empty}>
                  <strong>Nenhum indicador nesta situação.</strong>
                  <p>
                    {indicators.length
                      ? 'Escolha outra situação ou limpe o filtro.'
                      : 'Precisamos esclarecer seu objetivo para escolher o que acompanhar.'}
                  </p>
                </div>
              )}
            </section>
            <aside className={styles.card} aria-label="Detalhes do indicador">
              <p className={styles.eyebrow}>O QUE FALTA PARA ENTENDER</p>
              <h2>{selected?.name ?? 'Selecione um indicador'}</h2>
              {selected && (
                <>
                  <div className={styles.steps}>
                    {[
                      {
                        label: 'Fonte',
                        ok: selected.hasSource,
                        detail: selected.hasSource
                          ? selected.point?.source_label || 'Declarada por você'
                          : 'Não informada',
                      },
                      {
                        label: 'Valor',
                        ok: !!selected.values.length,
                        detail: selected.values.length
                          ? selected.point?.value_text
                          : selected.state === 'file'
                            ? 'Aguardando leitura do arquivo'
                            : 'Não recebido',
                      },
                      {
                        label: 'Período',
                        ok: !!selected.point?.period_label,
                        detail: selected.point?.period_label || 'Não informado',
                      },
                      {
                        label: 'Validação',
                        ok: selected.ready,
                        detail: selected.ready ? 'Valor validado com período' : 'Ainda pendente',
                      },
                    ].map((step, index) => (
                      <div key={step.label} className={styles.step} data-complete={step.ok}>
                        <span>{step.ok ? '✓' : '—'}</span>
                        <div>
                          <small>
                            {index + 1} · {step.label}
                          </small>
                          <p>{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selected.gaps.length > 0 ? (
                    <details className={styles.gaps} open>
                      <summary>
                        {selected.gaps.length} ponto{selected.gaps.length === 1 ? '' : 's'} de
                        atenção
                      </summary>
                      <ul>
                        {selected.gaps.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className={styles.note}>
                      Confira a origem e o período antes de comparar este valor com outras
                      informações.
                    </p>
                  )}
                  {!readOnly && selected.state !== 'validated' && (
                    <div className={styles.collect} key={selected.key}>
                      <p className={styles.label}>Completar este indicador</p>
                      <IndicatorDataForm
                        sessionId={sessionId}
                        indicatorKey={selected.key}
                        label={selected.name}
                      />
                      <IndicatorFileForm sessionId={sessionId} indicatorKey={selected.key} />
                    </div>
                  )}
                  <details className={styles.source}>
                    <summary>Por que acompanhar este número?</summary>
                    <p>{selected.why}</p>
                    <p>Fonte possível: {selected.source}</p>
                  </details>
                </>
              )}
            </aside>
          </div>
          <section className={styles.perceptions}>
            <div>
              <h2>Sua percepção da empresa</h2>
              <p>O que você sente. Sem notas ou percentuais.</p>
            </div>
            <div className={styles.perceptionGrid}>
              {map.radar.map((a) => (
                <div key={a.label}>
                  <span className={styles.signal} data-perception={a.perception}>
                    {marks[a.perception]}
                  </span>
                  <div>
                    <strong>{a.label}</strong>
                    <small>{perception[a.perception]}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {tab === 'Qualidade dos dados' && (
        <section className={styles.card}>
          <div className={styles.sectionTop}>
            <div>
              <h2>Onde a informação está incompleta</h2>
              <p>Um espaço vazio interrompe a análise. Clique no indicador para resolver.</p>
            </div>
            <span className={styles.small}>✓ recebido · — ausente · ! atenção</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.matrix}>
              <caption>
                Disponibilidade por indicador. A presença de um valor não comprova sua qualidade.
              </caption>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Fonte</th>
                  <th>Valor</th>
                  <th>Período</th>
                  <th>Validação</th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((i) => (
                  <tr key={i.key}>
                    <th>
                      <button type="button" onClick={() => inspect(i.key)}>
                        {i.name} ↗
                      </button>
                      <small>{i.area}</small>
                    </th>
                    {[i.hasSource, !!i.values.length, !!i.point?.period_label, i.ready].map(
                      (ok, index) => (
                        <td key={index}>
                          <button
                            type="button"
                            data-complete={ok}
                            onClick={() => inspect(i.key)}
                            aria-label={`${i.name}: ${['fonte', 'valor', 'período', 'validação'][index]} ${ok ? 'presente' : 'pendente'}`}
                          >
                            <span>
                              {index === 1 && (i.conflicts.length || i.values.some(isTestRecord))
                                ? '!'
                                : ok
                                  ? '✓'
                                  : '—'}
                            </span>
                            <small>
                              {index === 3
                                ? ok
                                  ? 'Validado'
                                  : 'Pendente'
                                : ok
                                  ? 'Presente'
                                  : 'Ausente'}
                            </small>
                          </button>
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!indicators.length && <p>Nenhum indicador identificado. Revise seu objetivo.</p>}
          <div className={styles.qualityNotes}>
            <div>
              <h3>Ainda não sabemos</h3>
              <ul>
                {map.unknowns.map((a) => (
                  <li key={a.question_id}>
                    {v3Questions.find((q) => q.id === a.question_id)?.title}
                  </li>
                ))}
                {!map.unknowns.length && <li>Nenhuma resposta marcada como desconhecida.</li>}
              </ul>
            </div>
            <div>
              <h3>Antes de comparar com a meta</h3>
              <p>
                Precisamos identificar a unidade, o período e o indicador da meta. Não calculamos um
                percentual de avanço apenas porque dois valores parecem comparáveis.
              </p>
              {map.ambiguities.map((a) => (
                <p key={a}>{a}</p>
              ))}
            </div>
          </div>
        </section>
      )}
      {tab === 'Suas respostas' && (
        <section className={styles.card}>
          <div className={styles.sectionTop}>
            <div>
              <h2>O que você informou</h2>
              <p>As respostas originais, sem transformar percepção em fato.</p>
            </div>
          </div>
          <dl className={styles.answers}>
            {answers
              .filter((a) => a.question_id !== 'v3_p10_confirm')
              .map((a) => (
                <div key={a.question_id}>
                  <dt>{v3Questions.find((q) => q.id === a.question_id)?.title}</dt>
                  <dd>
                    {displayV3Answer(a)}
                    <span>{answerStatus(a)}</span>
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      )}
      <footer className={styles.footer}>
        Baseado nas suas respostas e registros recebidos. Dados ausentes não são zero; dados
        recebidos ainda podem precisar de validação.
      </footer>
      <details className={styles.audit}>
        <summary>Ver detalhes e respostas do questionário</summary>
        <h3>Ainda não sabemos</h3>
        {map.unknowns.map((a) => (
          <p key={a.question_id}>
            {v3Questions.find((q) => q.id === a.question_id)?.title} — a descobrir.
          </p>
        ))}
        {dataPoints.map((p, index) => (
          <div key={index}>
            <strong>{p.source_label ?? p.source_type}</strong>
            <p>
              {p.value_text
                ? `Valor recebido: ${p.value_text}`
                : 'O arquivo ainda não foi transformado em valor do indicador.'}
            </p>
            <p>{p.period_label}</p>
          </div>
        ))}
        <button
          type="button"
          className={styles.textButton}
          onClick={() => setTab('Suas respostas')}
        >
          Ver todas as respostas
        </button>
      </details>
    </div>
  );
}
