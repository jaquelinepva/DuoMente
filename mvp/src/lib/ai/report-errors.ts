export type ReportStage = 'generation' | 'validation' | 'persistence' | 'audit';

// Only allowlisted metadata may enter logs. Never persist provider messages,
// request/response bodies, prompts, headers, or credentials.
export function reportFailure(
  error: unknown,
  stage: ReportStage,
  depth = 0,
): { stage: ReportStage; code: string; status?: number } {
  const value = error as {
    name?: string;
    statusCode?: number;
    cause?: unknown;
    lastError?: unknown;
    data?: { error?: { code?: string } };
  } | null;
  const status = value?.statusCode;
  let code =
    stage === 'persistence'
      ? 'REPORT_SAVE_FAILED'
      : stage === 'audit'
        ? 'REPORT_AUDIT_FAILED'
        : stage === 'validation'
          ? 'REPORT_INVALID'
          : 'AI_UNAVAILABLE';
  if (stage === 'generation') {
    if (status === 401 || status === 403) code = 'AI_AUTH_FAILED';
    else if (status === 429)
      code =
        value?.data?.error?.code === 'insufficient_quota'
          ? 'AI_QUOTA_EXHAUSTED'
          : 'AI_RATE_OR_QUOTA_LIMIT';
    else if (status === 400) code = 'AI_REQUEST_REJECTED';
    else if (status === 404) code = 'AI_MODEL_UNAVAILABLE';
    else if (value?.name === 'TimeoutError' || value?.name === 'AbortError') code = 'AI_TIMEOUT';
    else if (
      ['AI_NoObjectGeneratedError', 'ZodError', 'ReportValidationError'].includes(value?.name ?? '')
    )
      code = 'REPORT_INVALID';
    else if (depth < 5 && (value?.lastError || value?.cause))
      return reportFailure(value.lastError || value.cause, stage, depth + 1);
  }
  return { stage, code, ...(typeof status === 'number' ? { status } : {}) };
}

export function reportFailureMessage(code: string) {
  const messages: Record<string, string> = {
    AI_QUOTA_EXHAUSTED:
      'A cota da OpenAI está esgotada. O administrador precisa revisar os créditos e limites do projeto na OpenAI antes de tentar novamente.',
    AI_RATE_OR_QUOTA_LIMIT:
      'A OpenAI recusou a geração por limite de uso ou cota. Aguarde antes de tentar novamente. Se persistir, o administrador precisa verificar os limites e créditos do projeto na OpenAI.',
    AI_AUTH_FAILED:
      'A OpenAI não autorizou a geração. O administrador precisa revisar a chave e as permissões configuradas.',
    AI_MODEL_UNAVAILABLE:
      'O modelo de IA configurado não está disponível. O administrador precisa revisar a configuração.',
    AI_REQUEST_REJECTED:
      'A OpenAI recusou a solicitação de relatório. O administrador precisa verificar a configuração da geração.',
    AI_TIMEOUT: 'A geração demorou além do limite. Tente novamente em alguns instantes.',
    REPORT_INVALID: 'A resposta da IA não passou na validação. Tente gerar o relatório novamente.',
    REPORT_SAVE_FAILED: 'O relatório foi gerado, mas não foi possível salvá-lo. Tente novamente.',
  };
  return `${messages[code] ?? 'Não foi possível gerar o relatório. Tente novamente em alguns instantes.'} Suas respostas estão salvas.`;
}
