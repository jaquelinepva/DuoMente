import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { v3Questions } from '../src/lib/diagnostic-v3';
const mocks = vi.hoisted(() => ({ context: vi.fn() }));
vi.mock('@/lib/context', () => ({ context: mocks.context }));
import Home from '../src/app/app/page';
let answers: { question_id: string; answer: string; unknown: boolean; is_draft: boolean }[];
beforeEach(() => {
  answers = v3Questions.map((q) => ({
    question_id: q.id,
    answer: q.step === 10 ? 'confirmed' : 'N/D',
    unknown: q.step !== 10,
    is_draft: false,
  }));
  mocks.context.mockResolvedValue({
    org: 7,
    role: 'owner',
    client: {
      from(table: string) {
        const query = {
          select: () => query,
          eq: () => query,
          not: () => query,
          order: () => query,
          limit: () => query,
          single: () => query,
          then: (resolve: (value: unknown) => unknown) =>
            Promise.resolve(
              resolve({
                error: null,
                data:
                  table === 'organizations'
                    ? { name: 'Teste' }
                    : table === 'diagnostic_sessions'
                      ? [{ id: 'session', status: 'completed' }]
                      : table === 'diagnostic_answers'
                        ? answers
                        : [],
              }),
            ),
        };
        return query;
      },
    },
  });
});
it('mostra 10 de 10 e Mapa Inicial após concluir sem próxima pergunta legada', async () => {
  const html = renderToStaticMarkup(await Home());
  expect(html).toContain('10 de 10 etapas concluídas');
  expect(html).toContain('Seu Mapa Inicial está pronto.');
  expect(html).not.toContain('Continue seu diagnóstico');
  expect(html).not.toContain('/diagnostico/relatorio');
  expect(html).toContain('value="10" max="10"');
});
it('não conta rascunhos nem respostas legadas e usa a próxima pergunta v3', async () => {
  answers = [
    answers[0],
    { ...answers[1], is_draft: true },
    { ...answers[0], question_id: 'legacy' },
  ];
  const html = renderToStaticMarkup(await Home());
  expect(html).toContain('1 de 10 etapas concluídas');
  expect(html).toContain(v3Questions[1].title);
  expect(html).toContain('Continue seu diagnóstico.');
});
it('sessão legada não aparece como progresso v3', async () => {
  answers = [{ ...answers[0], question_id: 'legacy' }];
  const html = renderToStaticMarkup(await Home());
  expect(html).toContain('0 de 10 etapas concluídas');
  expect(html).toContain('Começar diagnóstico');
});
