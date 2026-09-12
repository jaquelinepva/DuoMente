import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ context: vi.fn() }));
vi.mock('@/lib/context', () => ({ context: mocks.context }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { startV3Diagnostic } from '../src/app/actions-v3';
let status = 'completed';
const inserts: unknown[] = [];
beforeEach(() => {
  status = 'completed';
  inserts.length = 0;
  mocks.context.mockImplementation(async () => ({
    org: 'org',
    user: { id: 'user' },
    client: {
      from(table: string) {
        const query = {
          select: () => query,
          eq: () => query,
          order: () => query,
          limit: () => query,
          insert: (value: unknown) => {
            inserts.push(value);
            return query;
          },
          then: (resolve: (value: unknown) => unknown) =>
            Promise.resolve(
              resolve({
                data: table === 'diagnostic_sessions' ? [{ id: 'old', status }] : [],
                error: null,
              }),
            ),
        };
        return query;
      },
    },
  }));
});
it('cria sessão vazia depois da conclusão sem atualizar nem apagar o histórico', async () => {
  await startV3Diagnostic();
  expect(mocks.context).toHaveBeenCalledWith(true);
  expect(inserts).toEqual([{ organization_id: 'org', created_by: 'user', status: 'in_progress' }]);
});
it('retoma uma sessão vazia em andamento em vez de criar outra', async () => {
  status = 'in_progress';
  await startV3Diagnostic();
  expect(inserts).toEqual([]);
});
it('não inicia sessão quando falta permissão de escrita', async () => {
  mocks.context.mockRejectedValueOnce(new Error('Sem permissão'));
  await expect(startV3Diagnostic()).rejects.toThrow('Sem permissão');
  expect(inserts).toEqual([]);
});
