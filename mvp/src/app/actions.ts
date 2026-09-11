'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import { context } from '@/lib/context';
import {
  evidenceSchema,
  objectiveSchema,
  nextQuestion,
  questions,
  statuses,
  areas,
  reportSchema,
} from '@/lib/domain';
import { generateExecutiveReport, PROMPT_VERSION } from '@/lib/ai/report';
import { reportFailure, type ReportStage } from '@/lib/ai/report-errors';
const str = (f: FormData, key: string) => String(f.get(key) ?? '').trim();
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
async function invalidateReport(client: Awaited<ReturnType<typeof db>>, org: number) {
  const { data } = await client
    .from('diagnostic_sessions')
    .select('id,report')
    .eq('organization_id', org)
    .order('created_at', { ascending: false })
    .limit(1);
  if (data?.[0]?.report)
    check(
      (
        await client
          .from('diagnostic_sessions')
          .update({ report: null, report_approved_at: null, status: 'in_progress' })
          .eq('organization_id', org)
          .eq('id', data[0].id)
      ).error,
    );
}
export async function openEvidence(form: FormData) {
  const { client, org } = await context();
  const { data, error } = await client
    .from('evidence_items')
    .select('storage_path')
    .eq('organization_id', org)
    .eq('id', z.uuid().parse(form.get('id')))
    .single();
  check(error);
  if (!data?.storage_path) throw new Error('Este registro não tem anexo.');
  const signed = await client.storage
    .from('evidence')
    .createSignedUrl(data.storage_path, 60, { download: true });
  check(signed.error);
  redirect(signed.data!.signedUrl);
}
export async function signOut() {
  const c = await db();
  check((await c.auth.signOut()).error);
  redirect('/login');
}
export async function selectOrg(form: FormData) {
  const c = await db();
  const {
    data: { user },
  } = await c.auth.getUser();
  if (!user) redirect('/login');
  const id = z.coerce.number().int().positive().parse(form.get('organization_id'));
  const { data } = await c
    .from('organization_members')
    .select('role')
    .eq('organization_id', id)
    .eq('user_id', user.id)
    .single();
  if (!data) throw new Error('Empresa não autorizada.');
  (await cookies()).set('duomente-org', String(id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  revalidatePath('/app', 'layout');
  redirect('/app');
}
export async function createOrg(form: FormData) {
  const c = await db();
  const name = z.string().min(2).max(200).parse(str(form, 'name'));
  const industry = z.string().min(2).max(200).parse(str(form, 'industry'));
  const { data, error } = await c.rpc('create_duomente_organization', {
    p_name: name,
    p_industry: industry,
  });
  check(error);
  (await cookies()).set('duomente-org', String(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  redirect('/app/diagnostico');
}
export async function saveBusiness(form: FormData) {
  const { client, org, user } = await context(true);
  const { data: existing } = await client
    .from('business_profiles')
    .select('created_by')
    .eq('organization_id', org)
    .maybeSingle();
  const fields = [
    'location',
    'operation_time',
    'people',
    'products',
    'customers',
    'channels',
    'revenue',
  ];
  const profile = Object.fromEntries(
    fields.map((key) => [key, z.string().max(2000).parse(str(form, key))]),
  );
  check(
    (
      await (existing
        ? client.from('business_profiles').update({ details: profile }).eq('organization_id', org)
        : client
            .from('business_profiles')
            .insert({ organization_id: org, details: profile, created_by: user.id }))
    ).error,
  );
  await invalidateReport(client, org);
  revalidatePath('/app/empresa');
}
export async function saveAnswer(input: {
  session_id: string;
  question_id: string;
  answer: string;
  unknown: boolean;
  draft?: boolean;
}) {
  const value = z
    .object({
      session_id: z.uuid(),
      question_id: z.string(),
      answer: z.string().max(6000),
      unknown: z.boolean(),
      draft: z.boolean().optional(),
    })
    .parse(input);
  const { client, org, user } = await context(true);
  const { data: session, error } = await client
    .from('diagnostic_sessions')
    .select('*')
    .eq('id', value.session_id)
    .eq('organization_id', org)
    .single();
  check(error);
  if (session.status === 'completed') throw new Error('Este diagnóstico já foi concluído.');
  const { data: existing } = await client
    .from('diagnostic_answers')
    .select('created_by')
    .eq('session_id', value.session_id)
    .eq('question_id', value.question_id)
    .eq('organization_id', org)
    .maybeSingle();
  const { data: answers } = await client
    .from('diagnostic_answers')
    .select('question_id,answer,unknown')
    .eq('session_id', value.session_id)
    .eq('organization_id', org)
    .eq('is_draft', false);
  if (nextQuestion(answers ?? [])?.id !== value.question_id)
    throw new Error('Atualize a página para continuar da pergunta atual.');
  if (!value.draft && !value.unknown && !value.answer.trim())
    throw new Error('Responda ou escolha Não sei responder.');
  const answerData = {
    answer: value.unknown ? 'N/D' : value.answer,
    unknown: value.unknown,
    is_draft: !!value.draft,
  };
  check(
    (
      await (existing
        ? client
            .from('diagnostic_answers')
            .update(answerData)
            .eq('organization_id', org)
            .eq('session_id', value.session_id)
            .eq('question_id', value.question_id)
        : client.from('diagnostic_answers').insert({
            ...answerData,
            organization_id: org,
            session_id: value.session_id,
            question_id: value.question_id,
            created_by: user.id,
          }))
    ).error,
  );
  check(
    (
      await client
        .from('diagnostic_sessions')
        .update({ status: 'in_progress', report: null, report_approved_at: null })
        .eq('id', value.session_id)
        .eq('organization_id', org)
    ).error,
  );
  revalidatePath('/app');
  return { ok: true };
}
export async function startDiagnostic() {
  const { client, org, user } = await context(true);
  const { data } = await client
    .from('diagnostic_sessions')
    .select('id')
    .eq('organization_id', org)
    .neq('status', 'completed')
    .limit(1);
  if (!data?.length)
    check(
      (
        await client
          .from('diagnostic_sessions')
          .insert({ organization_id: org, created_by: user.id })
      ).error,
    );
  revalidatePath('/app/diagnostico');
  redirect('/app/diagnostico');
}
export async function pauseDiagnostic(form: FormData) {
  const { client, org } = await context(true);
  check(
    (
      await client
        .from('diagnostic_sessions')
        .update({ status: 'paused' })
        .eq('organization_id', org)
        .eq('id', z.uuid().parse(form.get('id')))
    ).error,
  );
  redirect('/app');
}
export async function addEvidence(form: FormData) {
  const { client, org, user } = await context(true);
  const id = z.uuid().parse(form.get('request_id'));
  const data = evidenceSchema.parse(
    Object.fromEntries(
      ['description', 'classification', 'source', 'period', 'assumptions', 'confidence'].map(
        (k) => [k, str(form, k)],
      ),
    ),
  );
  async function findReceipt() {
    const result = await client
      .from('evidence_items')
      .select('*')
      .eq('organization_id', org)
      .eq('created_by', user.id)
      .eq('id', id)
      .maybeSingle();
    check(result.error);
    if (result.data && Object.entries(data).some(([key, value]) => result.data[key] !== value))
      throw new Error(
        'Este envio já foi registrado com outro conteúdo. Atualize a página para registrar uma nova evidência.',
      );
    return result.data;
  }
  if (await findReceipt()) return;
  let storage_path: string | null = null;
  const file = form.get('file');
  if (file instanceof File && file.size) {
    if (file.size > 3 * 1024 * 1024) throw new Error('O arquivo deve ter até 3 MB.');
    if (
      !['application/pdf', 'text/plain', 'text/csv', 'image/png', 'image/jpeg'].includes(file.type)
    )
      throw new Error('Use PDF, texto, CSV, PNG ou JPEG.');
    storage_path = `${org}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    check(
      (
        await client.storage
          .from('evidence')
          .upload(storage_path, file, { contentType: file.type, upsert: false })
      ).error,
    );
  }
  const { error } = await client.from('evidence_items').insert({
    id,
    ...data,
    organization_id: org,
    created_by: user.id,
    responsible: user.email,
    storage_path,
  });
  if (error && storage_path) await client.storage.from('evidence').remove([storage_path]);
  // The existing primary key arbitrates concurrent retries, including separate servers.
  if (error?.code === '23505' && (await findReceipt())) return;
  check(error);
  await invalidateReport(client, org);
  revalidatePath('/app', 'layout');
}
export async function saveObjective(form: FormData) {
  const { client, org, user } = await context(true);
  const { data: existing } = await client
    .from('global_objectives')
    .select('created_by')
    .eq('organization_id', org)
    .maybeSingle();
  const value = objectiveSchema.parse({
    ...Object.fromEntries(
      ['description', 'indicator', 'current_value', 'target_value', 'due_date', 'responsible'].map(
        (k) => [k, str(form, k)],
      ),
    ),
    areas: form.getAll('areas'),
    confirmed: form.get('confirmed') === 'on',
  });
  const objectiveData = {
    ...value,
    due_date: value.due_date || null,
    confirmed_at: new Date().toISOString(),
  };
  check(
    (
      await (existing
        ? client.from('global_objectives').update(objectiveData).eq('organization_id', org)
        : client
            .from('global_objectives')
            .insert({ ...objectiveData, organization_id: org, created_by: user.id }))
    ).error,
  );
  await invalidateReport(client, org);
  revalidatePath('/app', 'layout');
}
export async function generateReport(form: FormData) {
  const { client, org, user } = await context(true);
  const id = z.uuid().parse(form.get('id'));
  if (!process.env.OPENAI_API_KEY)
    return {
      error:
        'A geração por IA ainda precisa ser configurada pelo administrador. Suas respostas estão salvas.',
    };
  const [
    { data: session, error: sessionError },
    { data: answers, error: answersError },
    { data: evidence, error: evidenceError },
    { data: objective, error: objectiveError },
    { data: business, error: businessError },
  ] = await Promise.all([
    client.from('diagnostic_sessions').select('*').eq('organization_id', org).eq('id', id).single(),
    client
      .from('diagnostic_answers')
      .select('*')
      .eq('organization_id', org)
      .eq('session_id', id)
      .eq('is_draft', false),
    client.from('evidence_items').select('*').eq('organization_id', org),
    client.from('global_objectives').select('*').eq('organization_id', org).maybeSingle(),
    client.from('business_profiles').select('*').eq('organization_id', org).maybeSingle(),
  ]);
  if (sessionError || answersError || evidenceError || objectiveError || businessError)
    return { error: 'Não foi possível carregar os dados do diagnóstico. Tente novamente.' };
  if (!session || nextQuestion(answers ?? []))
    return { error: 'Conclua as perguntas antes de gerar o relatório.' };
  if (!objective?.confirmed_at) return { error: 'Confirme o objetivo global primeiro.' };
  const { data: run, error } = await client
    .from('agent_runs')
    .insert({
      organization_id: org,
      module: 'diretor',
      trigger_type: 'manual',
      status: 'running',
      agent_id: null,
      input_payload: { prompt_version: PROMPT_VERSION, session_id: id },
      created_by: user.id,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error || !run)
    return {
      error:
        'Não foi possível iniciar a geração. Suas respostas estão salvas. Código: REPORT_START_FAILED.',
    };
  let stage: ReportStage = 'generation';
  try {
    const report = await generateExecutiveReport(
      {
        business: business?.details ?? null,
        objective: {
          description: objective.description,
          indicator: objective.indicator,
          current_value: objective.current_value,
          target_value: objective.target_value,
          due_date: objective.due_date,
          areas: objective.areas,
        },
        answers: (answers ?? []).map((a) => ({
          question: questions.find((q) => q.id === a.question_id)?.text,
          answer: a.answer,
          unknown: a.unknown,
        })),
        evidence: (evidence ?? []).map((e) => ({
          id: e.id,
          description: e.description,
          classification: e.classification,
          source: e.source,
          period: e.period,
          confidence: e.confidence,
          assumptions: e.assumptions,
        })),
      },
      evidence ?? [],
    );
    stage = 'persistence';
    check(
      (
        await client
          .from('diagnostic_sessions')
          .update({ report, status: 'awaiting_approval', report_approved_at: null })
          .eq('organization_id', org)
          .eq('id', id)
          .select('id')
          .single()
      ).error,
    );
  } catch (error) {
    const failure = reportFailure(error, stage);
    console.error('duomente.report.failed', { run_id: run.id, ...failure });
    await client
      .from('agent_runs')
      .update({
        status: 'failed',
        error_message: JSON.stringify(failure),
        finished_at: new Date().toISOString(),
      })
      .eq('id', run!.id)
      .eq('organization_id', org);
    return {
      error: `Não foi possível ${stage === 'persistence' ? 'salvar' : 'gerar'} o relatório. Suas respostas estão salvas. Código: ${failure.code}.`,
    };
  }
  // A failed audit update must not turn a persisted report into a generation failure.
  try {
    const audit = await client
      .from('agent_runs')
      .update({
        status: 'succeeded',
        output_payload: { session_id: id },
        finished_at: new Date().toISOString(),
      })
      .eq('id', run.id)
      .eq('organization_id', org);
    if (audit.error)
      console.error('duomente.report.audit_failed', {
        run_id: run.id,
        code: 'REPORT_AUDIT_FAILED',
      });
  } catch {
    console.error('duomente.report.audit_failed', { run_id: run.id, code: 'REPORT_AUDIT_FAILED' });
  }
  revalidatePath('/app', 'layout');
  redirect('/app/diagnostico/relatorio');
}
export async function approveReport(form: FormData) {
  const { client, org } = await context(true);
  const id = z.uuid().parse(form.get('id'));
  const { data } = await client
    .from('diagnostic_sessions')
    .select('report')
    .eq('organization_id', org)
    .eq('id', id)
    .single();
  reportSchema.parse(data?.report);
  check(
    (
      await client
        .from('diagnostic_sessions')
        .update({ report_approved_at: new Date().toISOString(), status: 'completed' })
        .eq('organization_id', org)
        .eq('id', id)
    ).error,
  );
  revalidatePath('/app', 'layout');
}
export async function saveDecision(form: FormData) {
  const { client, org, user } = await context(true);
  const id = str(form, 'id');
  const value = {
    title: z.string().min(3).max(300).parse(str(form, 'title')),
    question: z.string().min(3).max(2000).parse(str(form, 'question')),
    area: z.enum(areas).parse(str(form, 'area')),
    status: z.enum(statuses).parse(str(form, 'status')),
    responsible: str(form, 'responsible'),
    due_date: str(form, 'due_date') || null,
    details: Object.fromEntries(
      [
        'problem',
        'facts',
        'hypotheses',
        'missing',
        'recommendation',
        'justification',
        'alternatives',
        'risks',
        'urgency',
        'confidence',
        'expected',
        'observed',
        'learning',
      ].map((k) => [k, z.string().max(6000).parse(str(form, k))]),
    ),
  };
  const { data: objective } = await client
    .from('global_objectives')
    .select('id')
    .eq('organization_id', org)
    .maybeSingle();
  const query = id
    ? client
        .from('decisions')
        .update({ ...value, objective_id: objective?.id ?? null })
        .eq('organization_id', org)
        .eq('id', z.uuid().parse(id))
    : client.from('decisions').insert({
        ...value,
        objective_id: objective?.id ?? null,
        organization_id: org,
        created_by: user.id,
      });
  const { data, error } = await query.select('id').single();
  check(error);
  revalidatePath('/app', 'layout');
  redirect(`/app/decisoes/${data!.id}`);
}
export async function linkEvidence(form: FormData) {
  const { client, org, user } = await context(true);
  check(
    (
      await client.from('decision_evidence').insert({
        organization_id: org,
        decision_id: z.uuid().parse(form.get('decision_id')),
        evidence_id: z.uuid().parse(form.get('evidence_id')),
        created_by: user.id,
      })
    ).error,
  );
  revalidatePath('/app/decisoes', 'layout');
}
export async function saveAction(form: FormData) {
  const { client, org, user } = await context(true);
  const id = str(form, 'id');
  const value = {
    title: z.string().min(3).max(500).parse(str(form, 'title')),
    responsible: str(form, 'responsible'),
    due_date: str(form, 'due_date') || null,
    status: z
      .enum(['Pendente', 'Em andamento', 'Concluída', 'Cancelada'])
      .parse(str(form, 'status')),
    decision_id: str(form, 'decision_id') || null,
    result: z.string().max(6000).parse(str(form, 'result')),
  };
  check(
    (
      await (id
        ? client
            .from('action_items')
            .update(value)
            .eq('id', z.uuid().parse(id))
            .eq('organization_id', org)
        : client
            .from('action_items')
            .insert({ ...value, organization_id: org, created_by: user.id }))
    ).error,
  );
  revalidatePath('/app', 'layout');
}
export async function manageMember(form: FormData) {
  const { client, org, role } = await context(true);
  if (!['owner', 'admin'].includes(role))
    throw new Error('Apenas Proprietário ou Administrador gerencia membros.');
  check(
    (
      await client.rpc('manage_duomente_member', {
        p_org: org,
        p_user: z.uuid().parse(form.get('user_id')),
        p_role: z
          .enum(['admin', 'manager', 'collaborator', 'viewer', 'remove'])
          .parse(form.get('role')),
      })
    ).error,
  );
  revalidatePath('/app/equipe');
}
