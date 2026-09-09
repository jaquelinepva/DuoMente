import { z } from 'zod';
export const areas = ['Marketing e Vendas', 'Finanças', 'Operações', 'Pessoas e RH'] as const;
export const classifications = [
  'Fato validado',
  'Dado declarado',
  'Interpretação',
  'Hipótese',
  'Estimativa',
  'Conflito',
  'Dado ausente',
  'Dado desatualizado',
] as const;
export const statuses = [
  'Identificada',
  'Em investigação',
  'Aguardando dados',
  'Pronta para decidir',
  'Em execução',
  'Em acompanhamento',
  'Concluída',
  'Cancelada',
] as const;
export const evidenceSchema = z
  .object({
    description: z.string().min(3).max(6000),
    classification: z.enum(classifications),
    source: z.string().max(1000),
    period: z.string().max(200),
    assumptions: z.string().max(2000),
    confidence: z.enum(['Baixa', 'Média', 'Alta']),
  })
  .superRefine((v, c) => {
    if (v.classification === 'Fato validado' && !v.source.trim())
      c.addIssue({ code: 'custom', message: 'Um fato validado exige fonte.', path: ['source'] });
    if (v.classification === 'Estimativa' && !v.assumptions.trim())
      c.addIssue({
        code: 'custom',
        message: 'Uma estimativa exige premissas.',
        path: ['assumptions'],
      });
  });
export const objectiveSchema = z.object({
  description: z.string().min(5).max(2000),
  indicator: z.string().max(200),
  current_value: z.string().max(100),
  target_value: z.string().max(100),
  due_date: z.string(),
  responsible: z.string().max(200),
  areas: z.array(z.enum(areas)).min(1),
  confirmed: z.literal(true),
});
const claim = z.object({
  text: z.string(),
  classification: z.enum(classifications),
  evidence_ids: z.array(z.string()),
  confidence: z.enum(['Baixa', 'Média', 'Alta']),
});
export const reportSchema = z.object({
  summary: z.string(),
  perceived_problems: z.array(z.string()),
  claims: z.array(claim),
  area_analysis: z
    .array(
      z.object({ area: z.enum(areas), analysis: z.string(), evidence_ids: z.array(z.string()) }),
    )
    .length(4),
  relationships: z.array(z.string()),
  priorities: z
    .array(
      z.object({
        title: z.string(),
        area: z.enum(areas),
        evidence_ids: z.array(z.string()),
        missing_information: z.string(),
        possible_impact: z.string(),
        urgency: z.enum(['Baixa', 'Média', 'Alta']),
        confidence: z.enum(['Baixa', 'Média', 'Alta']),
        decision: z.string(),
        next_action: z.string(),
        responsible: z.string().nullable(),
        suggested_deadline: z.string().nullable(),
      }),
    )
    .max(5),
  plan_30_days: z.array(
    z.object({ action: z.string(), period: z.string(), responsible: z.string().nullable() }),
  ),
  limitations: z.array(z.string()),
});
export type Report = z.infer<typeof reportSchema>;
export function validateReferences(
  report: Report,
  evidence: { id: string; classification: string }[],
) {
  const map = new Map(evidence.map((e) => [String(e.id), e]));
  for (const c of report.claims) {
    if (c.evidence_ids.some((id) => !map.has(id)))
      throw new Error('Fonte desconhecida no relatório.');
    if (
      c.classification === 'Fato validado' &&
      (!c.evidence_ids.length ||
        c.evidence_ids.some((id) => map.get(id)?.classification !== 'Fato validado'))
    )
      throw new Error('Fato sem evidência validada.');
  }
  for (const item of [...report.priorities, ...report.area_analysis])
    if (item.evidence_ids.some((id) => !map.has(id)))
      throw new Error('Fonte desconhecida no relatório.');
  return report;
}
export const concerns = [
  'O dinheiro parece não sobrar',
  'As vendas estão abaixo do esperado',
  'A equipe depende demais de mim',
  'A operação está desorganizada',
  'Tenho dados, mas não sei o que fazer com eles',
  'Não consigo identificar o principal problema',
  'Outro',
];
export type Question = {
  id: string;
  stage: number;
  text: string;
  why: string;
  options?: string[];
  area?: string;
  followup?: boolean;
};
export const questions: Question[] = [
  {
    id: 'concern',
    stage: 1,
    text: 'O que mais tira o seu sono na empresa hoje?',
    why: 'Vamos começar pela sua percepção. Ela ainda não confirma uma causa.',
    options: concerns,
  },
  ...[
    ['segment', 'Qual é o segmento da empresa?'],
    ['location', 'Em qual cidade e estado a empresa está?'],
    ['age', 'Há quanto tempo a empresa opera?'],
    ['people', 'Aproximadamente quantas pessoas trabalham aqui?'],
    ['products', 'Quais são os principais produtos ou serviços?'],
    ['customers', 'Quem são seus clientes?'],
    ['channels', 'Por quais canais vocês vendem?'],
    ['revenue', 'Como a empresa gera receita?'],
  ].map(([id, text]) => ({
    id,
    stage: 1,
    text,
    why: 'Isso ajuda a entender o contexto do seu negócio.',
  })),
  ...[
    ['role', 'Qual é a sua função na empresa?'],
    ['dependent_decisions', 'Quais decisões dependem de você?'],
    ['insecurity', 'Quais assuntos mais geram insegurança?'],
    ['how_decide', 'Como você toma decisões hoje?'],
    ['delayed', 'Qual decisão está sendo adiada?'],
    ['wanted_info', 'Que informação ajudaria você a decidir?'],
  ].map(([id, text]) => ({
    id,
    stage: 2,
    text,
    why: 'Vamos entender o que você precisa para decidir com mais clareza.',
  })),
  ...[
    ['started', 'Quando essa preocupação começou?'],
    ['frequency', 'Com que frequência isso acontece?'],
    ['impact', 'Qual impacto isso provoca?'],
    ['involved', 'Quem ou quais áreas estão envolvidos?'],
    ['tried', 'O que já foi tentado?'],
    ['attempt_result', 'Qual foi o resultado dessas tentativas?'],
  ].map(([id, text]) => ({
    id,
    stage: 3,
    text,
    why: 'Precisamos separar sintomas, tentativas e resultados observados.',
  })),
  {
    id: 'objective_intent',
    stage: 4,
    text: 'O que você quer melhorar na empresa e em quanto tempo?',
    why: 'Depois você poderá formular e confirmar seu objetivo global.',
  },
  ...areas.flatMap((area, i) => [
    {
      id: `area_${i}`,
      stage: 5,
      area,
      text: `Em ${area}, o que funciona bem e o que precisa de atenção?`,
      why: 'As quatro áreas podem influenciar o mesmo objetivo.',
      options: ['Funciona bem', 'Precisa de atenção'],
    },
    {
      id: `area_${i}_detail`,
      stage: 5,
      area,
      followup: true,
      text: `Em ${area}, qual situação concreta mostra essa dificuldade?`,
      why: 'Um exemplo ajuda a investigar sem presumir uma causa.',
    },
    {
      id: `area_${i}_evidence`,
      stage: 5,
      area,
      followup: true,
      text: `Que informação permitiria verificar essa situação em ${area}?`,
      why: 'Precisamos de evidências para testar a interpretação.',
    },
  ]),
  ...[
    ['sources', 'Onde estão as informações: sistemas, relatórios ou planilhas?'],
    ['recorder', 'Quem registra esses dados?'],
    ['period', 'Qual período está disponível?'],
    ['reliability', 'Quais dados parecem confiáveis e por quê?'],
    ['gaps', 'Quais dados estão ausentes, antigos ou em conflito?'],
  ].map(([id, text]) => ({
    id,
    stage: 6,
    text,
    why: 'A qualidade da informação define o que podemos concluir.',
  })),
];
export type Answer = { question_id: string; answer: string; unknown: boolean };
export function activeQuestions(answers: Answer[]) {
  return questions.filter(
    (q) =>
      !q.followup ||
      answers.some(
        (a) =>
          a.question_id === q.id.replace(/_(detail|evidence)$/, '') &&
          !a.unknown &&
          a.answer !== 'Funciona bem',
      ),
  );
}
export function nextQuestion(answers: Answer[]) {
  return activeQuestions(answers).find((q) => !answers.some((a) => a.question_id === q.id));
}
