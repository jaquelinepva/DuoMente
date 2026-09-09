import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { questions } from '../src/lib/domain';
const mocks = vi.hoisted(() => ({ context: vi.fn(), generate: vi.fn() }));
vi.mock('@/lib/context', () => ({ context: mocks.context }));
vi.mock('@/lib/ai/report', () => ({
  generateExecutiveReport: mocks.generate,
  PROMPT_VERSION: 'test',
}));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ db: vi.fn() }));
import { generateReport } from '../src/app/actions';
const changes: { table: string; value: unknown }[] = [];
let failRead = false;
const form = () => {
  const value = new FormData();
  value.set('id', 'f7f4c6b2-505d-4e6b-a6df-b18556b4ae8c');
  return value;
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('OPENAI_API_KEY', 'test-secret');
  changes.length = 0;
  failRead = false;
  const from = (table: string) => {
    const data =
      table === 'diagnostic_answers'
        ? questions.map((q) => ({ question_id: q.id, answer: 'N/D', unknown: true }))
        : table === 'evidence_items'
          ? []
          : table === 'global_objectives'
            ? { confirmed_at: '2026-09-09', description: 'Objetivo fictício' }
            : { id: 'test', details: {} };
    const query = {
      select: () => query,
      eq: () => query,
      single: () => query,
      maybeSingle: () => query,
      insert: (value: unknown) => {
        changes.push({ table, value });
        return query;
      },
      update: (value: unknown) => {
        changes.push({ table, value });
        return query;
      },
      then: (resolve: (result: unknown) => unknown) =>
        Promise.resolve(
          resolve({
            data,
            error:
              failRead && table === 'evidence_items' ? { message: 'database unavailable' } : null,
          }),
        ),
    };
    return query;
  };
  mocks.context.mockResolvedValue({ client: { from }, org: 123, user: { id: 'test-user' } });
});
afterEach(() => vi.unstubAllEnvs());
it('retorna mensagem útil sem expor erro interno nem salvar relatório fictício', async () => {
  mocks.generate.mockRejectedValue(new Error('provider internal test-secret'));
  const result = await generateReport(form());
  expect(result?.error).toContain('Suas respostas estão salvas');
  expect(JSON.stringify(result)).not.toContain('test-secret');
  expect(changes.some((c) => c.table === 'diagnostic_sessions')).toBe(false);
  expect(
    changes.some(
      (c) => c.table === 'agent_runs' && (c.value as { status: string }).status === 'failed',
    ),
  ).toBe(true);
});
it('não chama IA se a consulta de evidências falha', async () => {
  failRead = true;
  expect((await generateReport(form()))?.error).toContain('carregar os dados');
  expect(mocks.generate).not.toHaveBeenCalled();
});
it('informa configuração ausente sem perder respostas', async () => {
  vi.stubEnv('OPENAI_API_KEY', '');
  expect((await generateReport(form()))?.error).toContain('configurada');
  expect(changes).toHaveLength(0);
});
