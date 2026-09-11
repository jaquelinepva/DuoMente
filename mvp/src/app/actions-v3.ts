'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { context } from '@/lib/context';
import { isV3QuestionId, nextV3Question, validateV3Answer } from '@/lib/diagnostic-v3';

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function startV3Diagnostic() {
  const { client, org, user } = await context(true);
  const { data: sessions, error } = await client
    .from('diagnostic_sessions')
    .select('id,status,created_at')
    .eq('organization_id', org)
    .order('created_at', { ascending: false })
    .limit(1);
  check(error);

  const latest = sessions?.[0];
  let reuse = false;
  if (latest && latest.status !== 'completed') {
    const { data: answers, error: answerError } = await client
      .from('diagnostic_answers')
      .select('question_id')
      .eq('organization_id', org)
      .eq('session_id', latest.id);
    check(answerError);
    reuse = !answers?.length || answers.some((answer) => isV3QuestionId(answer.question_id));
  }

  if (!reuse) {
    check(
      (
        await client
          .from('diagnostic_sessions')
          .insert({ organization_id: org, created_by: user.id, status: 'in_progress' })
      ).error,
    );
  }

  revalidatePath('/app/diagnostico');
  return { ok: true };
}

export async function saveV3Answer(input: {
  session_id: string;
  question_id: string;
  answer: string;
  unknown: boolean;
}) {
  const value = z
    .object({
      session_id: z.uuid(),
      question_id: z.string().refine(isV3QuestionId, 'Pergunta inválida para o Diagnóstico v3.'),
      answer: z.string().max(6000),
      unknown: z.boolean(),
    })
    .parse(input);

  validateV3Answer(value.question_id, value.answer, value.unknown);

  const { client, org, user } = await context(true);
  const { data: session, error } = await client
    .from('diagnostic_sessions')
    .select('id,status')
    .eq('id', value.session_id)
    .eq('organization_id', org)
    .single();
  check(error);
  if (!session || session.status === 'completed') throw new Error('Este diagnóstico já foi concluído.');

  const { data: completed, error: completedError } = await client
    .from('diagnostic_answers')
    .select('question_id,answer,unknown')
    .eq('organization_id', org)
    .eq('session_id', value.session_id)
    .eq('is_draft', false);
  check(completedError);

  const v3Completed = (completed ?? []).filter((answer) => isV3QuestionId(answer.question_id));
  if (nextV3Question(v3Completed)?.id !== value.question_id)
    throw new Error('Atualize a página para continuar da pergunta atual.');

  const { data: existing, error: existingError } = await client
    .from('diagnostic_answers')
    .select('id')
    .eq('organization_id', org)
    .eq('session_id', value.session_id)
    .eq('question_id', value.question_id)
    .maybeSingle();
  check(existingError);

  const answerData = {
    answer: value.unknown ? 'N/D' : value.answer,
    unknown: value.unknown,
    is_draft: false,
  };

  if (existing) {
    check(
      (
        await client
          .from('diagnostic_answers')
          .update(answerData)
          .eq('organization_id', org)
          .eq('session_id', value.session_id)
          .eq('question_id', value.question_id)
      ).error,
    );
  } else {
    check(
      (
        await client.from('diagnostic_answers').insert({
          ...answerData,
          organization_id: org,
          session_id: value.session_id,
          question_id: value.question_id,
          created_by: user.id,
        })
      ).error,
    );
  }

  const willComplete = value.question_id === 'v3_p10_confirm' && !value.unknown;
  check(
    (
      await client
        .from('diagnostic_sessions')
        .update({
          status: willComplete ? 'completed' : 'in_progress',
          report: null,
          report_approved_at: null,
        })
        .eq('organization_id', org)
        .eq('id', value.session_id)
    ).error,
  );

  revalidatePath('/app/diagnostico');
  return { ok: true, completed: willComplete };
}
