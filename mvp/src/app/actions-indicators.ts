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

const fileMetaSchema = z.object({
  session_id: z.uuid(),
  indicator_key: z.string().min(1).max(80),
  period_label: z.string().max(120).optional().default(''),
});

const allowedMime = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
]);
const MAX_FILE_BYTES = 3 * 1024 * 1024;

async function ensureSession(client: Awaited<ReturnType<typeof context>>['client'], org: number, sessionId: string) {
  const { data: session, error } = await client
    .from('diagnostic_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('organization_id', org)
    .single();
  if (error || !session) throw new Error('Diagnóstico não encontrado para esta empresa.');
}

export async function saveManualIndicatorData(input: z.infer<typeof inputSchema>) {
  const value = inputSchema.parse(input);
  const { client, org, user } = await context(true);
  await ensureSession(client, org, value.session_id);

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

function safeName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || 'arquivo';
}

export async function uploadIndicatorFile(formData: FormData) {
  const meta = fileMetaSchema.parse({
    session_id: String(formData.get('session_id') ?? ''),
    indicator_key: String(formData.get('indicator_key') ?? ''),
    period_label: String(formData.get('period_label') ?? ''),
  });
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) throw new Error('Escolha um arquivo para enviar.');
  if (file.size > MAX_FILE_BYTES) throw new Error('O arquivo deve ter no máximo 3 MB.');
  if (!allowedMime.has(file.type)) throw new Error('Formato não aceito. Envie PDF, CSV, TXT, PNG ou JPG.');

  const { client, org, user } = await context(true);
  await ensureSession(client, org, meta.session_id);

  const { data: existing, error: existingError } = await client
    .from('indicator_data_points')
    .select('id,storage_path')
    .eq('organization_id', org)
    .eq('diagnostic_session_id', meta.session_id)
    .eq('indicator_key', meta.indicator_key)
    .eq('source_type', 'file')
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  const path = `${org}/indicator-data/${meta.session_id}/${meta.indicator_key}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await client.storage.from('evidence').upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(`Não foi possível enviar o arquivo: ${uploadError.message}`);

  const payload = {
    source_label: file.name,
    storage_path: path,
    value_text: null,
    period_label: meta.period_label.trim() || 'Período a identificar no arquivo',
    status: 'received',
    validated_at: null,
  };

  let databaseError: string | null = null;
  if (existing) {
    const { error } = await client
      .from('indicator_data_points')
      .update(payload)
      .eq('id', existing.id)
      .eq('organization_id', org);
    databaseError = error?.message ?? null;
  } else {
    const { error } = await client.from('indicator_data_points').insert({
      ...payload,
      organization_id: org,
      diagnostic_session_id: meta.session_id,
      indicator_key: meta.indicator_key,
      source_type: 'file',
      created_by: user.id,
    });
    databaseError = error?.message ?? null;
  }

  if (databaseError) {
    await client.storage.from('evidence').remove([path]);
    throw new Error(databaseError);
  }

  if (existing?.storage_path && existing.storage_path !== path) {
    await client.storage.from('evidence').remove([existing.storage_path]);
  }

  revalidatePath('/app/diagnostico');
  return { ok: true, file_name: file.name };
}
