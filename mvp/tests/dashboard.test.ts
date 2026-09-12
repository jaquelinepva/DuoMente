import { expect, it } from 'vitest';
import { dashboardIndicators, numericRecord, type DataPoint } from '../src/lib/dashboard';
const answers = [{ question_id: 'v3_p1_focus', answer: 'Vender/faturar mais', unknown: false }];
const point = (value: Partial<DataPoint> = {}): DataPoint => ({
  indicator_key: 'sales',
  source_type: 'manual',
  source_label: 'Informado manualmente',
  value_text: '1000',
  period_label: 'Agosto/2026',
  status: 'received',
  validated_at: null,
  storage_path: null,
  ...value,
});
it('ausência não vira zero e zero informado permanece um valor', () => {
  expect(numericRecord(null)).toBeNull();
  expect(numericRecord('')).toBeNull();
  expect(numericRecord('0')?.value).toBe(0);
  expect(numericRecord('10.000,50')?.value).toBe(10000.5);
  expect(numericRecord('10–20')).toBeNull();
  expect(numericRecord('50 mil')).toBeNull();
  expect(numericRecord('R$ 500')?.unit).toBe('R$');
});
it('arquivos não contam como valores e unidade não é presumida', () => {
  const result = dashboardIndicators(answers, [
    point({ value_text: null, source_type: 'file', source_label: 'vendas.csv' }),
  ]);
  expect(result[0].state).toBe('file');
  expect(result[0].numeric).toHaveLength(0);
  expect(result[1].state).toBe('missing');
  expect(numericRecord('1000')?.unit).toBe('');
});
it('registra conflitos de mesmo período em vez de selecionar uma verdade', () => {
  const result = dashboardIndicators(answers, [point(), point({ value_text: '2000' })])[0];
  expect(result.conflicts).toEqual(['agosto/2026']);
  expect(result.ready).toBe(false);
  expect(result.numeric).toHaveLength(2);
});
it('um registro de teste não conta como valor validado mesmo com flag', () => {
  const result = dashboardIndicators(answers, [
    point({ period_label: 'TESTE E2E FICTÍCIO', status: 'validated', validated_at: '2026-09-11' }),
  ])[0];
  expect(result.ready).toBe(false);
  expect(result.state).toBe('received');
  expect(result.gaps.join(' ')).toContain('teste fictício');
});
it('valor marcado validado precisa de confirmação e período para estar pronto', () => {
  expect(dashboardIndicators(answers, [point({ status: 'validated' })])[0].ready).toBe(false);
  expect(
    dashboardIndicators(answers, [
      point({ status: 'validated', validated_at: '2026-09-11', period_label: null }),
    ])[0].ready,
  ).toBe(false);
  expect(
    dashboardIndicators(answers, [point({ status: 'validated', validated_at: '2026-09-11' })])[0]
      .ready,
  ).toBe(true);
});
