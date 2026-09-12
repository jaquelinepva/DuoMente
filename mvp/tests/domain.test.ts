import { describe, it, expect } from 'vitest';
import {
  evidenceSchema,
  objectiveSchema,
  activeQuestions,
  nextQuestion,
  reportSchema,
  validateReferences,
} from '../src/lib/domain';
import { display } from '../src/lib/utils';
describe('integridade do diagnóstico', () => {
  it('preserva zero legítimo e usa N/D somente para ausência', () => {
    expect(display(0)).toBe('0');
    expect(display(null)).toBe('N/D');
    expect(display('10 a 20')).toBe('10 a 20');
  });
  it('não repete respostas e aprofunda somente áreas com atenção', () => {
    expect(nextQuestion([])?.id).toBe('concern');
    expect(nextQuestion([{ question_id: 'concern', answer: 'N/D', unknown: true }])?.id).toBe(
      'segment',
    );
    expect(
      activeQuestions([{ question_id: 'area_0', answer: 'Funciona bem', unknown: false }]).some(
        (q) => q.id === 'area_0_detail',
      ),
    ).toBe(false);
    expect(
      activeQuestions([
        { question_id: 'area_0', answer: 'Precisa de atenção', unknown: false },
      ]).some((q) => q.id === 'area_0_detail'),
    ).toBe(true);
  });
  it('recusa fato sem fonte e estimativa sem premissas', () => {
    const e = {
      description: 'Receita declarada',
      source: '',
      period: '',
      assumptions: '',
      confidence: 'Baixa',
    };
    expect(evidenceSchema.safeParse({ ...e, classification: 'Fato validado' }).success).toBe(false);
    expect(evidenceSchema.safeParse({ ...e, classification: 'Estimativa' }).success).toBe(false);
    expect(evidenceSchema.safeParse({ ...e, classification: 'Dado declarado' }).success).toBe(true);
  });
  it('exige confirmação humana do objetivo', () => {
    expect(
      objectiveSchema.safeParse({
        description: 'Melhorar o atendimento',
        indicator: '',
        current_value: '',
        target_value: '',
        due_date: '',
        responsible: '',
        areas: ['Operações'],
        confirmed: false,
      }).success,
    ).toBe(false);
  });
  it('recusa relatório com fonte inexistente ou fato apoiado apenas em declaração', () => {
    const report = reportSchema.parse({
      summary: 'Ainda não é possível concluir.',
      perceived_problems: [],
      claims: [
        {
          text: 'A receita caiu',
          classification: 'Fato validado',
          evidence_ids: ['a'],
          confidence: 'Alta',
        },
      ],
      area_analysis: ['Marketing e Vendas', 'Finanças', 'Operações', 'Pessoas e RH'].map(
        (area) => ({ area, analysis: 'N/D', evidence_ids: [] }),
      ),
      relationships: [],
      priorities: [],
      plan_30_days: [],
      limitations: ['Dados insuficientes'],
    });
    expect(() => validateReferences(report, [])).toThrow();
    expect(() =>
      validateReferences(report, [{ id: 'a', classification: 'Dado declarado' }]),
    ).toThrow();
    expect(() =>
      validateReferences(report, [{ id: 'a', classification: 'Fato validado' }]),
    ).not.toThrow();
  });
});
