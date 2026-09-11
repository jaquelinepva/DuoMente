import { z } from 'zod';

export const V3_PREFIX = 'v3_';
export const v3Statuses = ['Verde', 'Amarelo', 'Vermelho', 'Cinza'] as const;

export type V3Answer = { question_id: string; answer: string; unknown: boolean };
export type V3QuestionKind =
  | 'single'
  | 'text'
  | 'impact'
  | 'goal'
  | 'multi-priority'
  | 'radar'
  | 'data'
  | 'evidence'
  | 'confirm';

export type V3Question = {
  id: string;
  step: number;
  title: string;
  help: string;
  kind: V3QuestionKind;
  options?: string[];
};

export const v3Questions: V3Question[] = [
  {
    id: 'v3_p1_focus',
    step: 1,
    title: 'Se você pudesse resolver UMA coisa nos próximos 30 dias, qual seria?',
    help: 'Escolha o que mais precisa da sua atenção agora. Isso é sua percepção inicial, não uma causa comprovada.',
    kind: 'single',
    options: [
      'Vender/faturar mais',
      'Reduzir custos ou fazer o dinheiro sobrar',
      'Parar de perder clientes',
      'Melhorar processos, atrasos ou erros',
      'Resolver problemas de equipe/pessoas',
      'Tenho dados, mas não sei o que fazer com eles',
      'Não sei onde está o problema',
      'Outro',
    ],
  },
  {
    id: 'v3_p2_example',
    step: 2,
    title: 'Conte um exemplo real disso que aconteceu nos últimos 30 dias.',
    help: 'Um caso concreto ajuda a separar percepção de evidência. Se possível, use números que você realmente conhece.',
    kind: 'text',
  },
  {
    id: 'v3_p3_impact',
    step: 3,
    title: 'Você consegue estimar o tamanho desse impacto?',
    help: 'Estimativa não vira fato. Se não souber calcular, escolha essa opção sem problema.',
    kind: 'impact',
  },
  {
    id: 'v3_p4_goal',
    step: 4,
    title: 'Onde você está hoje e onde gostaria de chegar?',
    help: 'Use a sua linguagem. Nós traduzimos isso para indicadores depois. Unidade e período precisam ficar claros.',
    kind: 'goal',
  },
  {
    id: 'v3_p5_deadline',
    step: 5,
    title: 'Quando você gostaria de chegar lá?',
    help: 'Este é o prazo desejado. Se ultrapassar 30 dias, o DuoMente tratará os primeiros 30 dias como o primeiro ciclo de execução, não como promessa de atingir a meta inteira.',
    kind: 'single',
    options: ['1–2 semanas', '3–4 semanas', '1–3 meses', '3–6 meses', 'Mais de 6 meses', 'Ainda não sei'],
  },
  {
    id: 'v3_p6_blockers',
    step: 6,
    title: 'O que mais está impedindo isso hoje?',
    help: 'Marque o que se aplica e escolha um bloqueio principal. É sua percepção atual, não uma causa comprovada.',
    kind: 'multi-priority',
    options: [
      'Não tenho os números para entender o problema',
      'Sei o problema, mas não sei como resolver',
      'Falta dinheiro/caixa',
      'Falta tempo',
      'Falta equipe',
      'Falta conhecimento ou pessoa especializada',
      'Não sei por onde começar',
      'Outro',
    ],
  },
  {
    id: 'v3_p7_radar',
    step: 7,
    title: 'Como você enxerga sua empresa hoje?',
    help: 'Avalie as quatro áreas pela sua percepção. Depois o DuoMente separa essa percepção da situação baseada em dados.',
    kind: 'radar',
  },
  {
    id: 'v3_p8_data',
    step: 8,
    title: 'Quais números ou informações você realmente acompanha hoje?',
    help: 'Marque somente o que você de fato acompanha. Ter um dado não significa que ele já esteja validado.',
    kind: 'data',
  },
  {
    id: 'v3_p9_evidence',
    step: 9,
    title: 'Você tem algum dado ou documento que possa ajudar a comprovar o que respondeu?',
    help: 'Você pode registrar a fonte agora ou fazer isso depois. A existência de um arquivo não autoriza presumir seu conteúdo.',
    kind: 'evidence',
    options: ['Tenho planilha/arquivo', 'Tenho dados em um sistema', 'Tenho números anotados/manual', 'Quero fazer isso depois'],
  },
  {
    id: 'v3_p10_confirm',
    step: 10,
    title: 'Antes de analisar, confirme se entendemos corretamente.',
    help: 'Revise o resumo. Se algo estiver ambíguo, corrija antes de confirmar.',
    kind: 'confirm',
  },
];

export function isV3QuestionId(id: string) {
  return id.startsWith(V3_PREFIX);
}

export function nextV3Question(answers: V3Answer[]) {
  return v3Questions.find((q) => !answers.some((a) => a.question_id === q.id));
}

export function v3Progress(answers: V3Answer[]) {
  return v3Questions.filter((q) => answers.some((a) => a.question_id === q.id)).length;
}

const json = (value: string) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

export const impactSchema = z.object({
  mode: z.enum(['exact', 'range', 'other', 'unknown']),
  value: z.string().max(200).optional().default(''),
  unit: z.string().max(100).optional().default(''),
});

export const goalSchema = z.object({
  current: z.string().min(1).max(300),
  target: z.string().min(1).max(300),
  unit: z.string().min(1).max(100),
  period: z.string().min(1).max(100),
});

export const blockerSchema = z.object({
  selected: z.array(z.string().min(1)).min(1),
  primary: z.string().min(1),
});

export const radarSchema = z.object({
  marketing_sales: z.enum(v3Statuses),
  finance: z.enum(v3Statuses),
  operations: z.enum(v3Statuses),
  people: z.enum(v3Statuses),
});

export const dataSchema = z.object({
  selected: z.array(z.string()).min(1),
});

export function hasAmbiguousMagnitude(text: string) {
  return /\b\d+(?:[.,]\d+)?\s*(mi|milh[aã]o|milh[oõ]es|k)\b/i.test(text.trim());
}

export function validateV3Answer(questionId: string, answer: string, unknown: boolean) {
  if (unknown) return;
  if (!answer.trim()) throw new Error('Responda ou escolha Não sei responder.');
  if (questionId === 'v3_p3_impact') impactSchema.parse(json(answer));
  if (questionId === 'v3_p4_goal') {
    const parsed = goalSchema.parse(json(answer));
    const combined = `${parsed.current} ${parsed.target}`;
    if (hasAmbiguousMagnitude(combined))
      throw new Error('Há um valor ambíguo. Escreva por extenso ou com a unidade completa, por exemplo R$ 50.000 por mês.');
  }
  if (questionId === 'v3_p6_blockers') {
    const parsed = blockerSchema.parse(json(answer));
    if (!parsed.selected.includes(parsed.primary))
      throw new Error('O bloqueio principal precisa estar entre os itens marcados.');
  }
  if (questionId === 'v3_p7_radar') radarSchema.parse(json(answer));
  if (questionId === 'v3_p8_data') dataSchema.parse(json(answer));
  if (questionId === 'v3_p10_confirm' && answer !== 'confirmed')
    throw new Error('Revise o resumo antes de confirmar.');
}

export function parseV3Answer(answer: string) {
  return json(answer);
}
