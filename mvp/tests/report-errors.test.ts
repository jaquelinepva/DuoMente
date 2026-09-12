import { expect, it } from 'vitest';
import { reportFailure } from '../src/lib/ai/report-errors';
it('identifica quota mesmo dentro de erro de retry sem expor o corpo', () => {
  const failure = reportFailure(
    {
      lastError: {
        statusCode: 429,
        data: { error: { code: 'insufficient_quota' } },
        responseBody: 'private',
        requestBodyValues: 'secret',
      },
    },
    'generation',
  );
  expect(failure.code).toBe('AI_QUOTA_EXHAUSTED');
  expect(JSON.stringify(failure)).not.toMatch(/private|secret/);
});
it.each([
  [401, 'AI_AUTH_FAILED'],
  [400, 'AI_REQUEST_REJECTED'],
  [404, 'AI_MODEL_UNAVAILABLE'],
  [429, 'AI_RATE_OR_QUOTA_LIMIT'],
])('classifica status %s', (statusCode, code) => {
  expect(reportFailure({ statusCode }, 'generation').code).toBe(code);
});
it('distingue validação, timeout e persistência', () => {
  expect(reportFailure({ name: 'ReportValidationError' }, 'generation').code).toBe(
    'REPORT_INVALID',
  );
  expect(reportFailure({ name: 'TimeoutError' }, 'generation').code).toBe('AI_TIMEOUT');
  expect(reportFailure(new Error('private'), 'persistence').code).toBe('REPORT_SAVE_FAILED');
});
