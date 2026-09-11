import {
  blockerSchema,
  dataSchema,
  goalSchema,
  impactSchema,
  parseV3Answer,
  radarSchema,
  type V3Answer,
} from './diagnostic-v3';

export const radarAreas = [
  ['marketing_sales', 'Marketing e Vendas'],
  ['finance', 'Finanças'],
  ['operations', 'Operações/Processos'],
  ['people', 'Pessoas e RH'],
] as const;

export function isUnknownAnswer(a: V3Answer) {
  const impact = impactSchema.safeParse(parseV3Answer(a.answer));
  return (
    a.unknown ||
    ['N/D', 'Não sei', 'Não sei responder', 'Ainda não sei'].includes(a.answer.trim()) ||
    (a.question_id === 'v3_p3_impact' && impact.success && impact.data.mode === 'unknown')
  );
}

export function answerStatus(a: V3Answer) {
  if (isUnknownAnswer(a)) return 'A descobrir';
  if (a.question_id === 'v3_p10_confirm') return 'Resumo confirmado';
  if (['v3_p1_focus', 'v3_p6_blockers', 'v3_p7_radar'].includes(a.question_id))
    return 'Percepção declarada';
  if (a.question_id === 'v3_p3_impact') return 'Estimativa declarada';
  return 'Dado declarado — não validado';
}

export function displayV3Answer(a: V3Answer): string {
  if (isUnknownAnswer(a)) return 'Não sei / ainda precisamos descobrir';
  if (a.question_id === 'v3_p10_confirm') return 'Resumo confirmado por você';
  const value = parseV3Answer(a.answer);
  switch (a.question_id) {
    case 'v3_p3_impact': {
      const p = impactSchema.safeParse(value);
      return p.success
        ? `${p.data.value} ${p.data.unit}`.trim()
        : 'Impacto precisa ser esclarecido';
    }
    case 'v3_p4_goal': {
      const p = goalSchema.safeParse(value);
      return p.success
        ? `Hoje: ${p.data.current} · Meta: ${p.data.target} · Unidade informada: ${p.data.unit} · ${p.data.period}`
        : 'Objetivo precisa ser esclarecido';
    }
    case 'v3_p6_blockers': {
      const p = blockerSchema.safeParse(value);
      if (!p.success) return 'Bloqueios precisam ser esclarecidos';
      const other = p.data.selected.filter((x) => x !== p.data.primary);
      return `Principal: ${p.data.primary}${other.length ? `. Outros: ${other.join(', ')}` : ''}`;
    }
    case 'v3_p7_radar': {
      const p = radarSchema.safeParse(value);
      return p.success
        ? radarAreas
            .map(
              ([key, label]) =>
                `${label}: ${p.data[key] === 'Cinza' ? 'Não sei avaliar' : p.data[key]}`,
            )
            .join(' · ')
        : 'Percepção das áreas ainda desconhecida';
    }
    case 'v3_p8_data': {
      const p = dataSchema.safeParse(value);
      return p.success ? p.data.selected.join(', ') : 'Dados disponíveis precisam ser esclarecidos';
    }
    default:
      return value !== null && typeof value === 'object'
        ? 'Resposta precisa ser esclarecida'
        : a.answer;
  }
}

// Only unambiguous Brazilian numeric notation is eligible for a declared gap.
function number(value: string) {
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value.trim())) return null;
  const n = Number(value.replaceAll('.', '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function goalAmbiguities(answer: string) {
  const p = goalSchema.safeParse(parseV3Answer(answer));
  if (!p.success) return ['Situação atual, meta, unidade e período precisam ser esclarecidos.'];
  const result: string[] = [];
  if (
    /\d/.test(p.data.unit) ||
    !['r$', 'reais', 'clientes', 'vendas', 'horas', 'dias', 'pessoas', 'erros', 'pedidos'].includes(
      p.data.unit.toLowerCase().trim(),
    )
  )
    result.push(`Confirme a unidade “${p.data.unit}” antes de calcular a diferença para a meta.`);
  if (number(p.data.current) === null || number(p.data.target) === null)
    result.push(
      'Confirme os valores numéricos da situação atual e da meta antes de calcular a diferença.',
    );
  return result;
}

const catalog = {
  sales: {
    name: 'Quanto vende por mês',
    area: 'Marketing e Vendas',
    data: 'Faturamento/vendas do mês',
    source: 'Registro de vendas ou sistema comercial',
    why: 'Comparar as vendas reais com o objetivo declarado.',
  },
  customers: {
    name: 'Quantidade de clientes ou vendas',
    area: 'Marketing e Vendas',
    data: 'Quantidade de clientes/vendas',
    source: 'Registro de vendas',
    why: 'Entender o volume que compõe o faturamento.',
  },
  retention: {
    name: 'Clientes que voltam',
    area: 'Marketing e Vendas',
    data: 'Clientes que voltam/recompram',
    source: 'Histórico de compras por cliente',
    why: 'Verificar a preocupação declarada com perda de clientes.',
  },
  cash: {
    name: 'Dinheiro disponível',
    area: 'Finanças',
    data: 'Fluxo de caixa/saldo',
    source: 'Controle de entradas, saídas e saldo',
    why: 'Verificar a restrição percebida de dinheiro.',
  },
  margin: {
    name: 'Quanto sobra das vendas',
    area: 'Finanças',
    data: 'Lucro/margem',
    source: 'Vendas e despesas do mesmo período',
    why: 'Entender o objetivo de fazer o dinheiro sobrar.',
  },
  process: {
    name: 'Tempo do processo principal',
    area: 'Operações',
    data: 'Tempo do processo principal',
    source: 'Registros de início e conclusão das entregas',
    why: 'Verificar atrasos e capacidade de entrega.',
  },
  errors: {
    name: 'Erros e retrabalho',
    area: 'Operações',
    data: 'Erros, atrasos ou retrabalho',
    source: 'Registro de ocorrências',
    why: 'Medir o problema percebido nos processos.',
  },
  team: {
    name: 'Capacidade da equipe',
    area: 'Pessoas e RH',
    data: 'Horas disponíveis e demanda de trabalho',
    source: 'Escalas e registro de atividades',
    why: 'Verificar a restrição percebida da equipe.',
  },
};

export function buildInitialMap(answers: V3Answer[]) {
  const find = (id: string) => answers.find((a) => a.question_id === id);
  const text = (id: string) => {
    const a = find(id);
    return a ? displayV3Answer(a) : 'Ainda não informado';
  };
  const goalAnswer = find('v3_p4_goal');
  const goal = goalSchema.safeParse(parseV3Answer(goalAnswer?.answer ?? ''));
  const ambiguities =
    goalAnswer && !isUnknownAnswer(goalAnswer) ? goalAmbiguities(goalAnswer.answer) : [];
  const gap =
    goal.success && !goalAnswer?.unknown && !ambiguities.length
      ? number(goal.data.target)! - number(goal.data.current)!
      : null;
  const dataAnswer = find('v3_p8_data');
  const data = dataSchema.safeParse(parseV3Answer(dataAnswer?.answer ?? ''));
  const declaredData =
    data.success && !dataAnswer?.unknown
      ? data.data.selected.filter((x) => x !== 'Não acompanho nenhum desses dados')
      : [];
  if (
    data.success &&
    data.data.selected.includes('Não acompanho nenhum desses dados') &&
    declaredData.length
  )
    ambiguities.push(
      'Você marcou dados acompanhados e também que não acompanha nenhum. Confirme quais estão disponíveis.',
    );
  const keys = new Set<keyof typeof catalog>();
  const focus = find('v3_p1_focus');
  const focusText = focus && !isUnknownAnswer(focus) ? focus.answer : '';
  if (/vender|faturar/i.test(focusText)) {
    keys.add('sales');
    keys.add('customers');
  }
  if (/custos|sobrar/i.test(focusText)) {
    keys.add('margin');
    keys.add('cash');
  }
  if (/perder clientes/i.test(focusText)) keys.add('retention');
  if (/processos|atrasos|erros/i.test(focusText)) {
    keys.add('process');
    keys.add('errors');
  }
  if (/equipe|pessoas/i.test(focusText)) keys.add('team');
  const blockers = find('v3_p6_blockers');
  const blocked = blockers && !isUnknownAnswer(blockers) ? displayV3Answer(blockers) : '';
  if (/dinheiro|caixa/i.test(blocked)) keys.add('cash');
  if (/falta equipe/i.test(blocked)) keys.add('team');
  const indicators = [...keys].map((key) => ({
    ...catalog[key],
    key,
    status: declaredData.includes(catalog[key].data)
      ? 'Declarado — aguardando validação'
      : 'Faltante',
  }));
  const radarAnswer = find('v3_p7_radar');
  const radar = radarSchema.safeParse(parseV3Answer(radarAnswer?.answer ?? ''));
  return {
    text,
    gap,
    goal: goal.success ? goal.data : null,
    ambiguities,
    declaredData,
    indicators,
    radar: radarAreas.map(([key, label]) => ({
      label,
      perception: radar.success && !radarAnswer?.unknown ? radar.data[key] : 'Cinza',
    })),
    unknowns: answers.filter(isUnknownAnswer).filter((a) => a.question_id !== 'v3_p10_confirm'),
  };
}
