'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { context } from '@/lib/context';

const inputSchema = z.object({
  session_id: z.uuid(),
  indicator_key: z.string().min(1).max(80),
  value_text: z.string().min(1).max(300),
  period_label: z.string().min(1).max(120),
});

export async function saveManualIndicatorData(input: z.infer<typeof inputSchema>) {
  const value = inputSchema.parse(input);
  const { client, org, user } = await context(true);

  const { data: session, error: sessionError } = await client
    .from('diagnostic_sessions')
    .select('id')
    .eq('id', value.session_id)
    .eq('organization_id', org)
    .single();
  if (sessionError || !session) throw new Error('Diagnóstico não encontrado para esta empresa.');

  const { error } = await client.from('indicator_data_points').upsert(
    {
      organization_id: org,
      diagnostic_session_id: value.session_id,
      indicator_key: value.indicator_key,
      source_type: 'manual',
      source_label: 'Informado manualmente',
      value_text: value.value_text.trim(),
      period_label: value.period_label.trim(),
      status: 'received',
      created_by: user.id,
      validated_at: null,
    },
    { onConflict: 'organization_id,diagnostic_session_id,indicator_key,source_type' },
  );
  if (error) throw new Error(error.message);

  revalidatePath('/app/diagnostico');
  return { ok: true };
}
