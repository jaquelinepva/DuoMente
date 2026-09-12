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
  },
  {
    id: 'operacoes',
    name: 'Operações',
    icon: Layers,
    title: 'Desempenho operacional',
    subtitle: 'Prazos, erros e capacidade',
    bars: ['Previstas', 'Concluídas'],
    line: 'No prazo %',
    unit: 'Entregas',
    composition: 'Situação das entregas',
    parts: ['Concluídas', 'Em andamento', 'Planejadas', 'Em atraso', 'Bloqueadas'],
    keys: ['process', 'errors'],
  },
  {
    id: 'pessoas',
    name: 'Pessoas (RH)',
    icon: Users,
    title: 'Desempenho de pessoas',
    subtitle: 'Capacidade, demanda e estabilidade da equipe',
    bars: ['Disponíveis', 'Demandadas'],
    line: 'Ocupação %',
    unit: 'Horas',
    composition: 'Distribuição da equipe',
    parts: ['Operações', 'Comercial', 'Atendimento', 'Administrativo', 'Liderança'],
    keys: ['team'],
  },
] as const;

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

const helperText: Record<string, string> = {
  sales: 'Mostra o tamanho da receita que entra no negócio.',
  cash: 'Ajuda a saber se a empresa consegue sustentar as próximas decisões.',
  margin: 'Mostra se vender mais está realmente melhorando o resultado.',
  customers: 'Ajuda a entender de onde vem o volume de vendas.',
  retention: 'Mostra se os clientes voltam e ajudam a sustentar crescimento.',
  process: 'Ajuda a enxergar gargalos, atrasos e capacidade operacional.',
  errors: 'Mostra onde retrabalho e falhas podem estar consumindo resultado.',
  team: 'Ajuda a comparar capacidade da equipe com a demanda do negócio.',
};

function pointState(point?: DashboardPoint) {
  if (!point) return { label: 'Dado ainda não conectado', tone: 'missing' };
  if (point.status === 'validated') return { label: 'Dado validado', tone: 'validated' };
  if (point.status === 'rejected') return { label: 'Dado rejeitado', tone: 'rejected' };
  if (point.source_type === 'file' && !point.value_text)
    return { label: 'Arquivo recebido · aguardando leitura', tone: 'pending' };
  return { label: 'Valor recebido · aguardando validação', tone: 'pending' };
}

function IndicatorCards({ area, points }: { area: (typeof areas)[number]; points: DashboardPoint[] }) {
  return (
    <section className="cd-kpi-grid" aria-label={`Indicadores de ${area.name}`}>
      {area.keys.map((key) => {
        const point = points.find((p) => p.indicator_key === key);
        const state = pointState(point);
        return (
          <article className="cd-kpi" key={key}>
            <div className="cd-kpi-top">
              <span className={`cd-status cd-status-${state.tone}`}>{state.label}</span>
            </div>
            <p className="cd-kpi-label">{labels[key] ?? key}</p>
            <strong className={point?.value_text ? 'cd-kpi-value' : 'cd-kpi-empty'}>
              {point?.value_text || 'Ainda sem valor'}
            </strong>
            <p className="cd-kpi-period">{point?.period_label || 'Período ainda não informado'}</p>
            <p className="cd-kpi-help">{helperText[key]}</p>
            {!point?.value_text && (
              <Link href="/app/diagnostico" className="cd-inline-action">
                Adicionar dado <ArrowUpRight size={14} />
              </Link>
            )}
          </article>
        );
      })}
    </section>
  );
}

function EmptyTrend({ area, count }: { area: (typeof areas)[number]; count: number }) {
  return (
    <div className="cd-chart-wrap">
      <svg viewBox="0 0 780 310" role="img" aria-label="Sem histórico mensal comparável">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1="55" y1={260 - i * 55} x2="722" y2={260 - i * 55} className="cd-grid-line" />
            <text x="44" y={265 - i * 55} textAnchor="end">—</text>
          </g>
        ))}
        {Array.from({ length: count }).map((_, i) => (
          <text key={i} x={66 + i * (650 / count) + 325 / count} y="288" textAnchor="middle">—</text>
        ))}
        <text x="55" y="18">{area.unit}</text>
        <text x="720" y="18" textAnchor="end">{area.line}</text>
      </svg>
      <div className="cd-empty-chart">
        <span className="cd-empty-icon">↗</span>
        <strong>Seu histórico começa quando houver dados comparáveis</strong>
        <span>Precisamos de valores por período e unidades confirmadas para desenhar esta evolução.</span>
        <Link href="/app/diagnostico">Adicionar dados no Mapa Inicial <ArrowUpRight size={14} /></Link>
      </div>
    </div>
  );
}

function EmptyComposition({ area }: { area: (typeof areas)[number] }) {
  return (
    <div className="cd-composition">
      <svg viewBox="0 0 230 230" role="img" aria-label="Composição ainda sem dados">
        <circle cx="115" cy="115" r="86" className="cd-donut-track" strokeWidth="30" fill="none" />
        <text x="115" y="112" textAnchor="middle" className="cd-donut-total">—</text>
        <text x="115" y="138" textAnchor="middle">Sem dados</text>
      </svg>
      <ul>
        {area.parts.map((part) => (
          <li key={part}><i /><span>{part}</span><strong>—</strong></li>
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
  const [count, setCount] = useState(12);
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
          <p>Veja o que já sabemos, o que ainda falta e o que merece sua atenção.</p>
        </div>
        <Link href="/app/empresa" className="cd-profile">Perfil da empresa <ArrowUpRight size={16} /></Link>
      </div>

      {view === 'inteligencia' ? (
        <>
          <div className="cd-toolbar">
            <nav aria-label="Área do painel">
              {areas.map((a) => (
                <Link key={a.id} href={`/app/painel?area=${a.id}`} aria-current={a.id === area.id ? 'page' : undefined}>{a.name}</Link>
              ))}
            </nav>
          </div>

          <p className="cd-notice">
            <strong>Leitura atual:</strong> valores recebidos continuam separados dos dados validados. Ausência de histórico não significa resultado zero.
          </p>

          <IndicatorCards area={area} points={relevant} />

          <div className="cd-chart-grid">
            <section className="cd-panel">
              <header>
                <div><h2>{area.title}</h2><p>{area.subtitle}</p></div>
                <label className="cd-period">Período<select value={count} onChange={(e) => setCount(Number(e.target.value))}><option value={12}>12 meses</option><option value={6}>6 meses</option></select></label>
              </header>
              <div className="cd-legend">{[...area.bars, area.line].map((s, i) => <span key={s}><i data-series={i} />{s}</span>)}</div>
              <EmptyTrend area={area} count={count} />
            </section>

            <section className="cd-panel">
              <header><div><h2>{area.composition}</h2><p>Aguardando valores por categoria</p></div></header>
              <EmptyComposition area={area} />
              <p className="cd-footnote">A composição só será calculada quando houver dados classificados. Não criamos percentuais a partir de estimativas.</p>
            </section>
          </div>

          <section className="cd-panel cd-records">
            <header>
              <div><p className="cd-eyebrow">DADOS DA EMPRESA</p><h2>O que já chegou ao DuoMente</h2><p>Use esta lista para distinguir valor recebido, arquivo pendente e dado validado.</p></div>
              <Link href="/app/diagnostico">Informar agora <ArrowUpRight size={15} /></Link>
            </header>
            {relevant.length ? (
              <div className="cd-table-scroll"><table><thead><tr><th>Indicador</th><th>Valor</th><th>Período</th><th>Estado</th></tr></thead><tbody>
                {relevant.map((p, i) => <tr key={i}><td>{labels[p.indicator_key] ?? p.indicator_key}</td><td>{p.value_text || 'Valor ainda não recebido'}</td><td>{p.period_label || 'Não informado'}</td><td>{pointState(p).label}</td></tr>)}
              </tbody></table></div>
            ) : (
              <div className="cd-empty-records"><strong>Nenhum valor recebido nesta área.</strong><p>Comece pelos dados que o Mapa Inicial identificou como necessários.</p><Link href="/app/diagnostico">Adicionar primeiro dado →</Link></div>
            )}
          </section>
        </>
      ) : view === 'metas' ? (
        <section className="cd-panel cd-simple-view"><p className="cd-eyebrow">META DECLARADA NO DIAGNÓSTICO</p><h2>{goal || 'Sua meta ainda não foi informada'}</h2><p>A meta declarada ainda precisa de dados validados para que o DuoMente meça o avanço com segurança.</p><Link href="/app/diagnostico">Ver Mapa Inicial →</Link><hr /><h3>Resultados-chave</h3><p>Nenhum OKR foi definido. Os indicadores do Mapa Inicial são o ponto de partida para escolher resultados mensuráveis.</p></section>
      ) : view === 'documentos' ? (
        <section className="cd-panel cd-simple-view"><h2>Arquivos recebidos</h2>{documents.length ? documents.map((d, i) => <div className="cd-document" key={i}><FolderOpen size={22} /><div><strong>{d.source_label || 'Arquivo de evidência'}</strong><p>{labels[d.indicator_key] ?? d.indicator_key} · {d.status === 'validated' ? 'Validado' : d.status === 'rejected' ? 'Rejeitado' : 'Aguardando validação'}</p></div></div>) : <p>Nenhum documento recebido nesta empresa.</p>}<Link href="/app/diagnostico">Ver fontes no Mapa Inicial →</Link></section>
      ) : (
        <section className="cd-panel cd-simple-view"><h2>Mapa Inicial</h2><p>Consulte o objetivo declarado, as informações recebidas e o que ainda precisamos descobrir.</p><Link href="/app/diagnostico">Abrir Mapa Inicial →</Link><hr /><h3>Análise estratégica</h3><p>Ainda não disponível. A análise depende de evidências suficientes e valores validados.</p></section>
      )}
    </div>
  );
}

export function IntelligenceNavigation() {
  return (
    <>
      <nav aria-label="Inteligência">
        <p className="cd-nav-label">INTELIGÊNCIA</p>
        {[areas[1], areas[2], areas[0], areas[3]].map((a) => <Link href={`/app/painel?area=${a.id}`} key={a.id}><a.icon size={19} />{a.name}</Link>)}
      </nav>
      <nav aria-label="Gestão">
        <p className="cd-nav-label">GESTÃO</p>
        <Link href="/app/painel?view=relatorios"><FileText size={19} />Relatórios</Link>
        <Link href="/app/painel?view=metas"><Target size={19} />Metas e OKRs</Link>
        <Link href="/app/painel?view=documentos"><FolderOpen size={19} />Documentos</Link>
      </nav>
    </>
  );
}
