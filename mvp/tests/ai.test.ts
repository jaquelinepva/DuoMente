import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { areas } from '../src/lib/domain';
const mocks = vi.hoisted(() => ({ generate: vi.fn(), provider: vi.fn() }));
vi.mock('ai', () => ({ generateText: mocks.generate, Output: { object: vi.fn() } }));
vi.mock('@ai-sdk/openai', () => ({ createOpenAI: mocks.provider }));
import { generateExecutiveReport } from '../src/lib/ai/report';
const report = () => ({
  summary: 'Dados insuficientes.',
  perceived_problems: [],
  claims: [],
  area_analysis: areas.map((area) => ({ area, analysis: 'N/D', evidence_ids: [] })),
  relationships: [],
  priorities: [],
  plan_30_days: [],
  limitations: ['Dados insuficientes'],
});
describe('IA no servidor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    vi.stubEnv('AI_API_KEY', 'test-server-secret');
    vi.stubEnv('AI_BASE_URL', 'https://openrouter.ai/api/v1');
    vi.stubEnv('AI_MODEL', 'openai/gpt-4.1-mini');
    mocks.provider.mockReturnValue({ responses: vi.fn(() => 'test-model') });
  });
  afterEach(() => vi.unstubAllEnvs());
  it('não chama o provedor sem credencial', async () => {
    vi.stubEnv('AI_API_KEY', '');
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('OPENAI_API_KEY', '');
    await expect(generateExecutiveReport({}, [])).rejects.toThrow('AI_NOT_CONFIGURED');
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it('usa OpenRouter no servidor, limita execução e desativa armazenamento da resposta', async () => {
    mocks.generate.mockResolvedValue({ output: report() });
    const result = await generateExecutiveReport({ business: { name: 'Empresa fictícia' } }, []);
    expect(result.area_analysis).toHaveLength(4);
    expect(mocks.provider).toHaveBeenCalledWith({
      apiKey: 'test-server-secret',
      baseURL: 'https://openrouter.ai/api/v1',
    });
    const options = mocks.generate.mock.calls[0][0];
    expect(options.providerOptions.openai.store).toBe(false);
    expect(options.abortSignal).toBeInstanceOf(AbortSignal);
    expect(options.prompt).not.toContain('test-server-secret');
    expect(JSON.stringify(result)).not.toContain('test-server-secret');
  });
  it('recusa quatro entradas que repetem uma área', async () => {
    const invalid = report();
    invalid.area_analysis[3] = invalid.area_analysis[0];
    mocks.generate.mockResolvedValue({ output: invalid });
    await expect(generateExecutiveReport({}, [])).rejects.toThrow();
  });
  it('não cria relatório fictício quando o provedor falha', async () => {
    mocks.generate.mockRejectedValue(new Error('provider unavailable'));
    await expect(generateExecutiveReport({}, [])).rejects.toThrow('provider unavailable');
  });
  it('recusa resposta fora do contrato', async () => {
    mocks.generate.mockResolvedValue({ output: { summary: 'Texto incompleto' } });
    await expect(generateExecutiveReport({}, [])).rejects.toThrow();
  });
});
