import { describe, expect, it } from 'vitest';
import {
  hasAmbiguousMagnitude,
  nextV3Question,
  validateV3Answer,
  v3Questions,
  v3Progress,
} from '../src/lib/diagnostic-v3';

describe('Diagnóstico v3', () => {
  it('tem exatamente 10 telas base', () => {
    expect(v3Questions).toHaveLength(10);
    expect(v3Questions.map((q) => q.step)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  });

  it('começa pela dor percebida e avança sem perguntas legadas', () => {
    expect(nextV3Question([])?.id).toBe('v3_p1_focus');
    const first = [{ question_id: 'v3_p1_focus', answer: 'Vender/faturar mais', unknown: false }];
    expect(nextV3Question(first)?.id).toBe('v3_p2_example');
    expect(v3Progress(first)).toBe(1);
  });

  it('bloqueia abreviações monetárias ambíguas no objetivo', () => {
    expect(hasAmbiguousMagnitude('50 mi')).toBe(true);
    expect(() =>
      validateV3Answer(
        'v3_p4_goal',
        JSON.stringify({ current: '32.000', target: '50 mi', unit: 'R$', period: 'por mês' }),
        false,
      ),
    ).toThrow(/ambíguo/i);
  });

  it('aceita objetivo com unidade explícita', () => {
    expect(() =>
      validateV3Answer(
        'v3_p4_goal',
        JSON.stringify({ current: '32.000', target: '50.000', unit: 'R$', period: 'por mês' }),
        false,
      ),
    ).not.toThrow();
  });

  it('aceita não sei sem inventar valor', () => {
    expect(() => validateV3Answer('v3_p3_impact', '', true)).not.toThrow();
  });

  it('exige as quatro áreas no radar percebido', () => {
    expect(() =>
      validateV3Answer(
        'v3_p7_radar',
        JSON.stringify({ marketing_sales: 'Verde', finance: 'Cinza', operations: 'Amarelo' }),
        false,
      ),
    ).toThrow();
    expect(() =>
      validateV3Answer(
        'v3_p7_radar',
        JSON.stringify({ marketing_sales: 'Verde', finance: 'Cinza', operations: 'Amarelo', people: 'Vermelho' }),
        false,
      ),
    ).not.toThrow();
  });

  it('exige confirmação humana explícita na tela 10', () => {
    expect(() => validateV3Answer('v3_p10_confirm', 'qualquer coisa', false)).toThrow();
    expect(() => validateV3Answer('v3_p10_confirm', 'confirmed', false)).not.toThrow();
  });
});
