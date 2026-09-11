import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { InitialMap } from '../src/components/initial-map';
import {
  answerStatus,
  buildInitialMap,
  displayV3Answer,
  isUnknownAnswer,
} from '../src/lib/initial-map';
import { type V3Answer } from '../src/lib/diagnostic-v3';

const answer = (question_id: string, value: unknown, unknown = false): V3Answer => ({
  question_id,
  answer: typeof value === 'string' ? value : JSON.stringify(value),
  unknown,
});
describe('Mapa Inicial', () => {
  it('interpreta o Não sei antigo mesmo sem a flag e não mostra JSON nem confirmed', () => {
    const a = answer('v3_p3_impact', { mode: 'unknown', value: '', unit: 'R$ por mês' });
    expect(isUnknownAnswer(a)).toBe(true);
    expect(answerStatus(a)).toBe('A descobrir');
    expect(displayV3Answer(a)).toContain('Não sei');
    const html = renderToStaticMarkup(
      createElement(InitialMap, { answers: [a, answer('v3_p10_confirm', 'confirmed')] }),
    );
    expect(html).not.toContain('confirmed');
    expect(html).not.toContain('&quot;mode&quot;');
    expect(html).toContain('O que ainda não sabemos');
  });
  it('preserva unidade ambígua e não calcula um gap inventado', () => {
    const map = buildInitialMap([
      answer('v3_p4_goal', {
        current: '10000',
        target: '50000',
        unit: 'R$50000',
        period: 'por mês',
      }),
    ]);
    expect(map.gap).toBeNull();
    expect(map.ambiguities.join(' ')).toContain('R$50000');
  });
  it('calcula apenas diferença declarada com valores e unidade inequívocos', () => {
    const map = buildInitialMap([
      answer('v3_p4_goal', { current: '10.000', target: '50.000', unit: 'R$', period: 'por mês' }),
    ]);
    expect(map.gap).toBe(40000);
  });
  it.each([
    ['Vender/faturar mais', ['sales', 'customers']],
    ['Melhorar processos, atrasos ou erros', ['process', 'errors']],
    ['Resolver problemas de equipe/pessoas', ['team']],
  ])('seleciona indicadores relacionados ao objetivo %s', (focus, keys) => {
    const map = buildInitialMap([answer('v3_p1_focus', focus)]);
    expect(map.indicators.map((i) => i.key)).toEqual(keys);
    expect(map.indicators.every((i) => i.status === 'Faltante')).toBe(true);
  });
  it('não transforma existência declarada nem radar em fato validado', () => {
    const map = buildInitialMap([
      answer('v3_p1_focus', 'Vender/faturar mais'),
      answer('v3_p8_data', { selected: ['Faturamento/vendas do mês'] }),
      answer('v3_p7_radar', {
        marketing_sales: 'Verde',
        finance: 'Vermelho',
        operations: 'Cinza',
        people: 'Amarelo',
      }),
    ]);
    expect(map.indicators[0].status).toBe('Declarado — aguardando validação');
    expect(map.indicators[1].status).toBe('Faltante');
    expect(map.radar[0].perception).toBe('Verde');
    expect(answerStatus(answer('v3_p3_impact', { mode: 'exact', value: '1000', unit: 'R$' }))).toBe(
      'Estimativa declarada',
    );
  });
});
