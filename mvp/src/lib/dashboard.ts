import { buildInitialMap } from './initial-map';
import { type V3Answer } from './diagnostic-v3';

export type DataPoint = {
  indicator_key: string;
  source_type: string;
  source_label: string | null;
  value_text: string | null;
  period_label: string | null;
  status: string;
  validated_at: string | null;
  storage_path: string | null;
};
export const statusLabels = {
  validated: 'Validado',
  received: 'Valor recebido · aguardando validação',
  file: 'Arquivo recebido · aguardando leitura',
  declared: 'Só fonte declarada',
  missing: 'Sem informação recebida',
} as const;
export type DataState = keyof typeof statusLabels;

// Read only explicit numeric notation. Never turn empty, ranges or prose into zero.
export function numericRecord(raw: string | null) {
  if (!raw?.trim()) return null;
  const match = raw.trim().match(/^(R\$\s*)?(-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?)(\s*%)?$/);
  if (!match || (match[1] && match[3])) return null;
  const value = Number(match[2].replaceAll('.', '').replace(',', '.'));
  return Number.isFinite(value) ? { value, unit: match[1] ? 'R$' : match[3] ? '%' : '' } : null;
}
export function isTestRecord(p: DataPoint) {
  return /\b(teste|test|fict[ií]cio|demo|e2e)\b/i.test(
    `${p.period_label ?? ''} ${p.source_label ?? ''}`,
  );
}
export function dashboardIndicators(answers: V3Answer[], dataPoints: DataPoint[]) {
  return buildInitialMap(answers).indicators.map((indicator) => {
    const points = dataPoints.filter((p) => p.indicator_key === indicator.key);
    const values = points.filter((p) => p.value_text?.trim());
    const valid = values.filter(
      (p) => p.status === 'validated' && !!p.validated_at && !isTestRecord(p),
    );
    const point = valid[0] ?? values[0] ?? points[0];
    const source = !!points.length || indicator.status === 'Fonte declarada — valor não recebido';
    const state: DataState = valid.length
      ? 'validated'
      : values.length
        ? 'received'
        : points.some((p) => p.source_type === 'file')
          ? 'file'
          : source
            ? 'declared'
            : 'missing';
    const periods = new Map<string, Set<string>>();
    for (const p of values) {
      if (!p.period_label?.trim() || isTestRecord(p)) continue;
      const key = p.period_label.trim().toLocaleLowerCase('pt-BR');
      const n = numericRecord(p.value_text);
      const value = n ? `${n.unit}:${n.value}` : p.value_text!.trim();
      periods.set(key, new Set([...(periods.get(key) ?? []), value]));
    }
    const conflicts = [...periods]
      .filter(([, values]) => values.size > 1)
      .map(([period]) => period);
    const gaps: string[] = [];
    if (!source) gaps.push('A fonte desse número ainda não foi informada.');
    if (!values.length)
      gaps.push(
        state === 'file'
          ? 'O arquivo ainda não foi transformado em valor do indicador.'
          : 'Nenhum valor foi recebido. Ausência não significa zero.',
      );
    if (values.length && !point?.period_label?.trim())
      gaps.push('Falta identificar o período do valor recebido.');
    if (values.some((p) => numericRecord(p.value_text) === null))
      gaps.push('Há valores em texto ou formato ambíguo que não podem entrar no gráfico.');
    if (values.some((p) => isTestRecord(p)))
      gaps.push(
        'Há registro identificado como teste fictício. Ele não representa o desempenho real.',
      );
    if (conflicts.length)
      gaps.push(
        `Valores diferentes para o mesmo período: ${conflicts.join(', ')}. Confirme qual registro deve ser usado.`,
      );
    if (!valid.length) gaps.push('Ainda não há valor validado para apoiar uma decisão.');
    return {
      ...indicator,
      points,
      values,
      point,
      state,
      hasSource: source,
      conflicts,
      gaps,
      ready: !!valid.length && !conflicts.length && !!valid[0].period_label?.trim(),
      numeric: values
        .map((p, index) => ({ point: p, index, parsed: numericRecord(p.value_text) }))
        .filter((r) => r.parsed !== null),
    };
  });
}
