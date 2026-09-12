'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BarChart3,
  Layers,
  Wallet,
  Users,
  FileText,
  Target,
  FolderOpen,
  ArrowUpRight,
} from 'lucide-react';
import './company-dashboard.css';

export type DashboardPoint = {
  indicator_key: string;
  value_text: string | null;
  period_label: string | null;
  status: string;
  source_type: string;
  source_label: string | null;
};
const areas = [
  {
    id: 'financeiro',
    name: 'Financeiro',
    icon: Wallet,
    title: 'Desempenho financeiro',
    subtitle: 'Receita, custo e margem',
    bars: ['Receita', 'Custo'],
    line: 'Margem %',
    unit: 'R$',
    composition: 'Composição da receita',
    parts: ['Corporativo', 'Operadoras', 'Eventos', 'Lazer', 'Outros'],
    keys: ['sales', 'cash', 'margin'],
    values: [270, 290, 310, 360, 390, 490, 440, 315, 355, 420, 455, 570],
    second: [200, 215, 230, 260, 280, 355, 320, 220, 255, 305, 355, 390],
    rates: [26, 26, 26, 28, 28, 28, 27, 30, 28, 27, 22, 32],
  },
  {
    id: 'marketing',
    name: 'Marketing & Vendas',
    icon: BarChart3,
    title: 'Desempenho de marketing e vendas',
    subtitle: 'Oportunidades, vendas e conversão',
    bars: ['Oportunidades', 'Vendas'],
    line: 'Conversão %',
    unit: 'Quantidade',
    composition: 'Vendas por canal',
    parts: ['Indicação', 'Busca orgânica', 'Anúncios', 'Redes sociais', 'Outros'],
    keys: ['sales', 'customers', 'retention'],
    values: [270, 290, 310, 360, 390, 490, 440, 315, 355, 420, 455, 570],
    second: [54, 64, 68, 90, 98, 137, 119, 85, 103, 126, 146, 188],
    rates: [20, 22, 22, 25, 25, 28, 27, 27, 29, 30, 32, 33],
  },
  {
    id: 'operacoes',
    name: 'Operações',
    icon: Layers,
    title: 'Desempenho operacional',
    subtitle: 'Entregas previstas, concluídas e pontualidade',
    bars: ['Previstas', 'Concluídas'],
    line: 'No prazo %',
    unit: 'Entregas',
    composition: 'Situação das entregas',
    parts: ['Concluídas', 'Em andamento', 'Planejadas', 'Em atraso', 'Bloqueadas'],
    keys: ['process', 'errors'],
    values: [260, 280, 300, 320, 350, 410, 380, 320, 360, 390, 420, 460],
    second: [240, 255, 280, 300, 330, 385, 355, 310, 340, 370, 405, 440],
    rates: [82, 84, 86, 88, 87, 90, 89, 91, 92, 93, 94, 96],
  },
  {
    id: 'pessoas',
    name: 'Pessoas (RH)',
    icon: Users,
    title: 'Desempenho de pessoas',
    subtitle: 'Horas disponíveis, demanda e ocupação',
    bars: ['Disponíveis', 'Demandadas'],
    line: 'Ocupação %',
    unit: 'Horas',
    composition: 'Distribuição da equipe',
    parts: ['Operações', 'Comercial', 'Atendimento', 'Administrativo', 'Liderança'],
    keys: ['team'],
    values: [420, 420, 440, 440, 460, 480, 480, 460, 480, 500, 520, 540],
    second: [300, 320, 340, 350, 370, 400, 390, 360, 400, 430, 450, 470],
    rates: [71, 76, 77, 80, 80, 83, 81, 78, 83, 86, 87, 87],
  },
];
const colors = ['#2476ff', '#ff914d', '#15cf91', '#9b63f5', '#f5bd42'];
const labels: Record<string, string> = {
  sales: 'Quanto vende por mês',
  cash: 'Dinheiro disponível',
  margin: 'Quanto sobra das vendas',
  customers: 'Clientes ou vendas',
  retention: 'Clientes que voltam',
  process: 'Tempo do processo',
  errors: 'Erros e retrabalho',
  team: 'Capacidade da equipe',
};
const months = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const parts = [58, 18, 12, 8, 4];

function Trend({
  area,
  count,
  demo,
}: {
  area: (typeof areas)[number];
  count: number;
  demo: boolean;
}) {
  const start = 12 - count,
    x = (i: number) => 66 + i * (650 / count) + 325 / count;
  return (
    <div className="cd-chart-wrap">
      <svg
        viewBox="0 0 780 310"
        role="img"
        aria-label={
          demo
            ? `${area.title}: exemplo fictício de ${count} meses`
            : 'Sem histórico mensal comparável'
        }
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1="55" y1={260 - i * 55} x2="722" y2={260 - i * 55} stroke="#1b3042" />
            <text x="44" y={265 - i * 55} textAnchor="end">
              {demo ? i * 150 + (area.unit === 'R$' && i ? 'k' : '') : '—'}
            </text>
            <text x="733" y={265 - i * 55}>
              {i * 25}%
            </text>
          </g>
        ))}
        {months.slice(start).map((m, i) => (
          <g key={m}>
            <text x={x(i)} y="288" textAnchor="middle">
              {m}
            </text>
            {demo && (
              <>
                <rect
                  x={x(i) - 19}
                  y={260 - (area.values[i + start] / 600) * 220}
                  width="17"
                  height={(area.values[i + start] / 600) * 220}
                  rx="2"
                  fill="#15c98c"
                />
                <rect
                  x={x(i) + 2}
                  y={260 - (area.second[i + start] / 600) * 220}
                  width="17"
                  height={(area.second[i + start] / 600) * 220}
                  rx="2"
                  fill="#2784fa"
                />
              </>
            )}
          </g>
        ))}
        {demo && (
          <>
            <polyline
              points={area.rates
                .slice(start)
                .map((v, i) => `${x(i)},${260 - (v / 100) * 220}`)
                .join(' ')}
              fill="none"
              stroke="#ad78ff"
              strokeWidth="3"
            />
            {area.rates.slice(start).map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={260 - (v / 100) * 220}
                r="4"
                fill="#e4cfff"
                stroke="#ad78ff"
                strokeWidth="2"
              />
            ))}
          </>
        )}
        <text x="55" y="18">
          {area.unit}
          {area.unit === 'R$' ? ' · milhares' : ''}
        </text>
        <text x="720" y="18" textAnchor="end">
          {area.line}
        </text>
      </svg>
      {!demo && (
        <div className="cd-empty-chart">
          <strong>Seu histórico começa com dados comparáveis</strong>
          <span>
            Precisamos de valores por mês e unidades confirmadas para desenhar esta evolução.
          </span>
          <Link href="/app/diagnostico">
            Informar dados no Mapa Inicial <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

function Composition({ area, demo }: { area: (typeof areas)[number]; demo: boolean }) {
  let offset = 0;
  return (
    <div className="cd-composition">
      <svg
        viewBox="0 0 230 230"
        role="img"
        aria-label={demo ? 'Composição ilustrativa, dados fictícios' : 'Composição ainda sem dados'}
      >
        <circle cx="115" cy="115" r="86" fill="none" stroke="#182f43" strokeWidth="30" />
        {demo &&
          parts.map((p, i) => {
            const pos = offset;
            offset += p;
            return (
              <circle
                key={i}
                cx="115"
                cy="115"
                r="86"
                pathLength="100"
                fill="none"
                stroke={colors[i]}
                strokeWidth="30"
                strokeDasharray={`${p} ${100 - p}`}
                strokeDashoffset={-pos}
                transform="rotate(-90 115 115)"
              />
            );
          })}
        <text x="115" y="112" textAnchor="middle" className="cd-donut-total">
          {demo ? '100%' : '—'}
        </text>
        <text x="115" y="138" textAnchor="middle">
          {demo ? 'Exemplo' : 'Sem dados'}
        </text>
      </svg>
      <ul>
        {area.parts.map((part, i) => (
          <li key={part}>
            <i style={{ background: colors[i] }} />
            <span>{part}</span>
            <strong>{demo ? `${parts[i]}%` : '—'}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompanyDashboard({
  points,
  initialArea = 'financeiro',
  view = 'inteligencia',
  goal,
  documents = [],
}: {
  points: DashboardPoint[];
  initialArea?: string;
  view?: string;
  goal?: string;
  documents?: { source_label: string | null; indicator_key: string; status: string }[];
}) {
  const [demo, setDemo] = useState(false),
    [count, setCount] = useState(12);
  const area = areas.find((a) => a.id === initialArea) ?? areas[0];
  const relevant = points.filter((p) => area.keys.includes(p.indicator_key));
  return (
    <div className="company-dashboard">
      <div className="cd-heading">
        <div>
          <p className="cd-eyebrow">PAINEL DA EMPRESA</p>
          <h1>
            {view === 'metas'
              ? 'Metas e OKRs'
              : view === 'documentos'
                ? 'Documentos'
                : view === 'relatorios'
                  ? 'Relatórios'
                  : area.name}
          </h1>
          <p>Uma visão clara para acompanhar sua empresa.</p>
        </div>
        <Link href="/app/empresa" className="cd-profile">
          Perfil da empresa <ArrowUpRight size={16} />
        </Link>
      </div>
      {view === 'inteligencia' ? (
        <>
          <div className="cd-toolbar">
            <nav aria-label="Área do painel">
              {areas.map((a) => (
                <Link
                  key={a.id}
                  href={`/app/painel?area=${a.id}`}
                  aria-current={a.id === area.id ? 'page' : undefined}
                >
                  {a.name}
                </Link>
              ))}
            </nav>
            <label className="cd-demo">
              <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
              Ver demonstração
            </label>
          </div>
          {demo ? (
            <p className="cd-notice">
              DEMONSTRAÇÃO · Todos os números e categorias dos gráficos são fictícios. Nenhum valor
              será salvo.
            </p>
          ) : (
            <p className="cd-notice">
              Dados da empresa · Valores recebidos permanecem separados dos dados validados.
              Ausência de histórico não significa resultado zero.
            </p>
          )}
          <div className="cd-chart-grid">
            <section className="cd-panel">
              <header>
                <div>
                  <h2>{area.title}</h2>
                  <p>
                    {area.subtitle}
                    {demo ? ` · ${count === 12 ? 'Jul/2025' : 'Jan/2026'} a Jun/2026 (exemplo)` : ''}
                  </p>
                </div>
                <label className="cd-period">
                  Período
                  <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                    <option value={12}>12 meses</option>
                    <option value={6}>6 meses</option>
                  </select>
                </label>
              </header>
              <div className="cd-legend">
                {[...area.bars, area.line].map((s, i) => (
                  <span key={s}>
                    <i style={{ background: ['#15c98c', '#2784fa', '#ad78ff'][i] }} />
                    {s}
                  </span>
                ))}
              </div>
              <Trend area={area} demo={demo} count={count} />
            </section>
            <section className="cd-panel">
              <header>
                <div>
                  <h2>{area.composition}</h2>
                  <p>{demo ? 'Junho/2026 · exemplo' : 'Aguardando valores por categoria'}</p>
                </div>
              </header>
              <Composition area={area} demo={demo} />
              {!demo && (
                <p className="cd-footnote">
                  As categorias são uma sugestão. A composição será calculada quando houver dados
                  classificados.
                </p>
              )}
            </section>
          </div>
          <section className="cd-panel cd-records">
            <header>
              <div>
                <p className="cd-eyebrow">DADOS DA EMPRESA</p>
                <h2>O que já chegou ao DuoMente</h2>
                <p>Estes registros são reais, mesmo com a demonstração ativada.</p>
              </div>
              <Link href="/app/diagnostico">
                Informar agora <ArrowUpRight size={15} />
              </Link>
            </header>
            {relevant.length ? (
              <div className="cd-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>Valor</th>
                      <th>Período</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relevant.map((p, i) => (
                      <tr key={i}>
                        <td>{labels[p.indicator_key] ?? p.indicator_key}</td>
                        <td>{p.value_text || 'Valor ainda não recebido'}</td>
                        <td>{p.period_label || 'Não informado'}</td>
                        <td>
                          {p.status === 'validated'
                            ? 'Validado'
                            : p.status === 'rejected'
                              ? 'Rejeitado'
                              : p.source_type === 'file' && !p.value_text
                                ? 'Arquivo recebido · aguardando leitura'
                                : 'Valor recebido · aguardando validação'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="cd-footnote">
                Ainda não há valores recebidos para esta área. Comece pelos indicadores do Mapa
                Inicial.
              </p>
            )}
          </section>
        </>
      ) : view === 'metas' ? (
        <section className="cd-panel">
          <p className="cd-eyebrow">META DECLARADA NO DIAGNÓSTICO</p>
          <h2>{goal || 'Sua meta ainda não foi informada'}</h2>
          <p>
            A meta declarada ainda precisa de unidade, prazo e valores validados para medir o
            avanço.
          </p>
          <Link href="/app/diagnostico">Ver Mapa Inicial →</Link>
          <hr />
          <h3>Resultados-chave</h3>
          <p>
            Nenhum OKR foi definido. Os indicadores do Mapa Inicial são o ponto de partida para
            escolher resultados mensuráveis.
          </p>
        </section>
      ) : view === 'documentos' ? (
        <section className="cd-panel">
          <h2>Arquivos recebidos</h2>
          {documents.length ? (
            documents.map((d, i) => (
              <div className="cd-document" key={i}>
                <FolderOpen size={22} />
                <div>
                  <strong>{d.source_label || 'Arquivo de evidência'}</strong>
                  <p>
                    {labels[d.indicator_key] ?? d.indicator_key} ·{' '}
                    {d.status === 'validated'
                      ? 'Validado'
                      : d.status === 'rejected'
                        ? 'Rejeitado'
                        : 'Aguardando validação'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum documento recebido nesta empresa.</p>
          )}
          <Link href="/app/diagnostico">Ver fontes no Mapa Inicial →</Link>
        </section>
      ) : (
        <section className="cd-panel">
          <h2>Mapa Inicial</h2>
          <p>
            Consulte o objetivo declarado, as informações recebidas e o que ainda precisamos
            descobrir.
          </p>
          <Link href="/app/diagnostico">Abrir Mapa Inicial →</Link>
          <hr />
          <h3>Análise estratégica</h3>
          <p>
            Ainda não disponível. A análise depende de evidências suficientes e valores validados.
          </p>
        </section>
      )}
    </div>
  );
}

export function IntelligenceNavigation() {
  return (
    <>
      <nav aria-label="Inteligência">
        <p className="cd-nav-label">INTELIGÊNCIA</p>
        {[areas[1], areas[2], areas[0], areas[3]].map((a) => (
          <Link href={`/app/painel?area=${a.id}`} key={a.id}>
            <a.icon size={19} />
            {a.name}
          </Link>
        ))}
      </nav>
      <nav aria-label="Gestão">
        <p className="cd-nav-label">GESTÃO</p>
        <Link href="/app/painel?view=relatorios">
          <FileText size={19} />
          Relatórios
        </Link>
        <Link href="/app/painel?view=metas">
          <Target size={19} />
          Metas e OKRs
        </Link>
        <Link href="/app/painel?view=documentos">
          <FolderOpen size={19} />
          Documentos
        </Link>
      </nav>
    </>
  );
}
