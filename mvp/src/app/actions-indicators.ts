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

  const { data: existing, error: existingError } = await client
    .from('indicator_data_points')
    .select('id')
    .eq('organization_id', org)
    .eq('diagnostic_session_id', value.session_id)
    .eq('indicator_key', value.indicator_key)
    .eq('source_type', 'manual')
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  const payload = {
    source_label: 'Informado manualmente',
    value_text: value.value_text.trim(),
    period_label: value.period_label.trim(),
    status: 'received',
    validated_at: null,
  };

  if (existing) {
    const { error } = await client
      .from('indicator_data_points')
      .update(payload)
      .eq('id', existing.id)
      .eq('organization_id', org);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await client.from('indicator_data_points').insert({
      ...payload,
      organization_id: org,
      diagnostic_session_id: value.session_id,
      indicator_key: value.indicator_key,
      source_type: 'manual',
      created_by: user.id,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath('/app/diagnostico');
  return { ok: true };
}
