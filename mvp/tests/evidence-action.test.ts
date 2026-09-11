import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ context: vi.fn() }));
vi.mock('@/lib/context', () => ({ context: mocks.context }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ db: vi.fn() }));
vi.mock('@/lib/ai/report', () => ({ generateExecutiveReport: vi.fn(), PROMPT_VERSION: 'test' }));
import { addEvidence } from '../src/app/actions';
const rows = new Map<string, Record<string, unknown>>();
const form = (id = '29b917b4-ebc6-4b57-9260-8f193caf6208') => {
  const f = new FormData();
  Object.entries({
    request_id: id,
    description: 'Venda de teste',
    classification: 'Dado declarado',
    source: 'Teste',
    period: '2026-08',
    assumptions: '',
    confidence: 'Média',
  }).forEach(([k, v]) => f.set(k, v));
  return f;
};
beforeEach(() => {
  rows.clear();
  mocks.context.mockResolvedValue({
    org: 1,
    user: { id: 'owner', email: 'test@example.com' },
    client: {
      from: (table: string) => {
        const filters: Record<string, unknown> = {};
        let insert: Record<string, unknown> | undefined;
        const q = {
          select: () => q,
          eq: (k: string, v: unknown) => {
            filters[k] = v;
            return q;
          },
          order: () => q,
          limit: () => q,
          maybeSingle: () => q,
          insert: (v: Record<string, unknown>) => {
            insert = v;
            return q;
          },
          then: (resolve: (v: unknown) => unknown) => {
            if (table !== 'evidence_items')
              return Promise.resolve(resolve({ data: [], error: null }));
            if (insert) {
              if (rows.has(String(insert.id)))
                return Promise.resolve(resolve({ error: { code: '23505', message: 'duplicate' } }));
              rows.set(String(insert.id), insert);
              return Promise.resolve(resolve({ error: null }));
            }
            const row = rows.get(String(filters.id));
            const data =
              row && Object.entries(filters).every(([k, v]) => row[k] === v) ? row : null;
            return Promise.resolve(resolve({ data, error: null }));
          },
        };
        return q;
      },
    },
  });
});
it('12 requisições simultâneas com a mesma chave criam apenas uma evidência', async () => {
  await Promise.all(Array.from({ length: 12 }, () => addEvidence(form())));
  expect(rows.size).toBe(1);
  await addEvidence(form());
  expect(rows.size).toBe(1);
});
it('um novo envio intencional usa outra chave', async () => {
  await addEvidence(form());
  await addEvidence(form('82358125-9378-4431-96ab-4b69b7c66dbd'));
  expect(rows.size).toBe(2);
});
it('não sobrescreve uma chave já registrada com conteúdo diferente', async () => {
  await addEvidence(form());
  const changed = form();
  changed.set('description', 'Outro conteúdo');
  await expect(addEvidence(changed)).rejects.toThrow('outro conteúdo');
  expect(rows.size).toBe(1);
});
it('recusa envio sem chave antes de inserir', async () => {
  const missing = form();
  missing.delete('request_id');
  await expect(addEvidence(missing)).rejects.toThrow();
  expect(rows.size).toBe(0);
});
