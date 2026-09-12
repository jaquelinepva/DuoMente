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

const sessionId = '11111111-1111-4111-8111-111111111111';
const renderMap = (answers: V3Answer[], dataPoints: Array<{ indicator_key:string; source_type:string; source_label:string|null; value_text:string|null; period_label:string|null; status:string; validated_at:string|null }> = []) =>
  renderToStaticMarkup(createElement(InitialMap, { answers, sessionId, readOnly: true, dataPoints }));

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
    const html = renderMap([a, answer('v3_p10_confirm', 'confirmed')]);
    expect(html).not.toContain('confirmed');
    expect(html).not.toContain('&quot;mode&quot;');
    expect(html).toContain('Ainda não sabemos');
  });

  it('preserva unidade legada ambígua sem expô-la ao empresário', () => {
    const legacy = answer('v3_p4_goal', {
      current: '10000', target: '50000', unit: 'R$50000', period: 'por mês',
    });
    const map = buildInitialMap([legacy]);
    expect(map.gap).toBeNull();
    expect(map.ambiguities.join(' ')).not.toContain('unidade antiga');
    expect(displayV3Answer(legacy)).toBe('50000');
    const html = renderMap([legacy]);
    expect(html).not.toContain('unidade antiga');
    expect(html).not.toContain('R$50000');
  });

  it('calcula apenas diferença declarada legada com valores e unidade inequívocos', () => {
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
    expect(map.indicators.every((i) => i.status === 'Sem fonte declarada')).toBe(true);
  });

  it('não transforma fonte declarada nem radar em fato validado', () => {
    const map = buildInitialMap([
      answer('v3_p1_focus', 'Vender/faturar mais'),
      answer('v3_p8_data', { selected: ['Faturamento/vendas do mês'] }),
      answer('v3_p7_radar', { marketing_sales: 'Verde', finance: 'Vermelho', operations: 'Cinza', people: 'Amarelo' }),
    ]);
    expect(map.indicators[0].status).toBe('Fonte declarada — valor não recebido');
    expect(map.indicators[1].status).toBe('Sem fonte declarada');
    expect(map.radar[0].perception).toBe('Verde');
    expect(answerStatus(answer('v3_p3_impact', { mode: 'exact', value: '1000', unit: 'R$' }))).toBe('Estimativa declarada');
  });

  it('mostra valor recebido sem tratá-lo como validado', () => {
    const html = renderMap(
      [answer('v3_p1_focus', 'Vender/faturar mais')],
      [{ indicator_key: 'sales', source_type: 'manual', source_label: 'Informado manualmente', value_text: '32000', period_label: 'agosto de 2026', status: 'received', validated_at: null }],
    );
    expect(html).toContain('Valor recebido · aguardando validação');
    expect(html).toContain('32000');
    expect(html).toContain('agosto de 2026');
    expect(html).not.toContain('>Validado<');
  });
});
