import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const pg = new PGlite();
const ownerA = '10000000-0000-4000-8000-000000000001',
  ownerB = '10000000-0000-4000-8000-000000000002',
  viewer = '10000000-0000-4000-8000-000000000003',
  outsider = '10000000-0000-4000-8000-000000000004',
  manager = '10000000-0000-4000-8000-000000000005',
  admin = '10000000-0000-4000-8000-000000000006';
let orgA: number, orgB: number, decisionA: string, decisionB: string;
async function asUser<T>(uid: string, run: () => Promise<T>) {
  await pg.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`,
  );
  try {
    return await run();
  } finally {
    await pg.exec('reset role');
  }
}
beforeAll(async () => {
  await pg.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;insert into auth.users values('${ownerA}'),('${ownerB}'),('${viewer}'),('${outsider}'),('${manager}'),('${admin}');`,
  );
  await pg.exec(readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));
  orgA = await asUser(ownerA, async () =>
    Number(
      (
        await pg.query<{ id: number }>(
          "select public.create_duomente_organization('Empresa teste A','Serviços') id",
        )
      ).rows[0].id,
    ),
  );
  orgB = await asUser(ownerB, async () =>
    Number(
      (
        await pg.query<{ id: number }>(
          "select public.create_duomente_organization('Empresa teste B','Comércio') id",
        )
      ).rows[0].id,
    ),
  );
  await asUser(ownerA, async () => {
    await pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, viewer, 'viewer']);
    await pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, manager, 'manager']);
    await pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, admin, 'admin']);
  });
  decisionA = await asUser(
    ownerA,
    async () =>
      (
        await pg.query<{ id: string }>(
          "insert into public.decisions(organization_id,title,question,area) values($1,'Decisão A','O que fazer A?','Operações') returning id",
          [orgA],
        )
      ).rows[0].id,
  );
  decisionB = await asUser(
    ownerB,
    async () =>
      (
        await pg.query<{ id: string }>(
          "insert into public.decisions(organization_id,title,question,area) values($1,'Decisão B','O que fazer B?','Operações') returning id",
          [orgB],
        )
      ).rows[0].id,
  );
});
afterAll(() => pg.close());
describe('RLS real em PostgreSQL local', () => {
  it('cada proprietário lê somente sua organização', async () => {
    const rows = await asUser(
      ownerA,
      async () => (await pg.query('select * from public.decisions')).rows,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveProperty('title', 'Decisão A');
  });
  it('não altera nem insere dados de outra empresa', async () => {
    const rows = await asUser(
      ownerA,
      async () =>
        (
          await pg.query('update public.decisions set title=$1 where id=$2 returning id', [
            'Intrusão',
            decisionB,
          ])
        ).rows,
    );
    expect(rows).toHaveLength(0);
    await expect(
      asUser(ownerA, () =>
        pg.query(
          "insert into public.decisions(organization_id,title,question,area) values($1,'Intrusão','Q','Operações')",
          [orgB],
        ),
      ),
    ).rejects.toThrow();
  });
  it('não permite trocar organization_id mesmo com vínculo nas duas empresas', async () => {
    await asUser(ownerB, () =>
      pg.query('select public.manage_duomente_member($1,$2,$3)', [orgB, ownerA, 'manager']),
    );
    await expect(
      asUser(ownerA, () =>
        pg.query('update public.decisions set organization_id=$1 where id=$2', [orgB, decisionA]),
      ),
    ).rejects.toThrow('Organization is immutable');
  });
  it('usuário sem vínculo não acessa organizações nem decisões', async () => {
    expect(
      await asUser(
        outsider,
        async () => (await pg.query('select * from public.organizations')).rows,
      ),
    ).toHaveLength(0);
    expect(
      await asUser(outsider, async () => (await pg.query('select * from public.decisions')).rows),
    ).toHaveLength(0);
  });
  it('somente leitura não altera registros', async () => {
    expect(
      await asUser(
        viewer,
        async () =>
          (
            await pg.query('update public.decisions set title=$1 where id=$2 returning id', [
              'Alterado',
              decisionA,
            ])
          ).rows,
      ),
    ).toHaveLength(0);
    await expect(
      asUser(viewer, () =>
        pg.query("insert into public.action_items(organization_id,title) values($1,'Ação')", [
          orgA,
        ]),
      ),
    ).rejects.toThrow();
  });
  it('somente proprietário ou administrador gerencia membros', async () => {
    await expect(
      asUser(manager, () =>
        pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, outsider, 'manager']),
      ),
    ).rejects.toThrow('Admin required');
    await expect(
      asUser(viewer, () =>
        pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, viewer, 'admin']),
      ),
    ).rejects.toThrow('Admin required');
    await asUser(admin, () =>
      pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, outsider, 'collaborator']),
    );
    await asUser(admin, () =>
      pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, outsider, 'remove']),
    );
  });
  it('preserva proprietário e bloqueia promoção de administrador por outro administrador', async () => {
    await expect(
      asUser(admin, () =>
        pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, ownerA, 'remove']),
      ),
    ).rejects.toThrow('Owner cannot');
    await expect(
      asUser(admin, () =>
        pg.query('select public.manage_duomente_member($1,$2,$3)', [orgA, manager, 'admin']),
      ),
    ).rejects.toThrow('Only owner');
  });
  it('vínculos entre tabelas não atravessam empresas', async () => {
    await expect(
      asUser(ownerB, () =>
        pg.query(
          'insert into public.action_items(organization_id,decision_id,title) values($1,$2,$3)',
          [orgB, decisionA, 'Cross tenant'],
        ),
      ),
    ).rejects.toThrow();
  });
  it('histórico é gerado pelo banco e não pode ser adulterado', async () => {
    await asUser(ownerA, () =>
      pg.query('update public.decisions set title=$1 where id=$2', ['Decisão revisada', decisionA]),
    );
    const history = await asUser(
      ownerA,
      async () =>
        (
          await pg.query<{ old_data: { title: string }; new_data: { title: string } }>(
            "select old_data,new_data from public.audit_logs where record_id=$1 and operation='UPDATE'",
            [decisionA],
          )
        ).rows,
    );
    expect(history[0].old_data.title).toBe('Decisão A');
    expect(history[0].new_data.title).toBe('Decisão revisada');
    await expect(asUser(ownerA, () => pg.query('delete from public.audit_logs'))).rejects.toThrow();
  });
  it('storage recusa leitura entre empresas e upload por somente leitura', async () => {
    await asUser(ownerB, () =>
      pg.query("insert into storage.objects(bucket_id,name,owner_id) values('evidence',$1,$2)", [
        `${orgB}/source.pdf`,
        ownerB,
      ]),
    );
    expect(
      await asUser(
        viewer,
        async () =>
          (await pg.query("select * from storage.objects where bucket_id='evidence'")).rows,
      ),
    ).toHaveLength(0);
    await expect(
      asUser(viewer, () =>
        pg.query("insert into storage.objects(bucket_id,name,owner_id) values('evidence',$1,$2)", [
          `${orgA}/forbidden.pdf`,
          viewer,
        ]),
      ),
    ).rejects.toThrow();
  });
  it('banco recusa fato sem fonte, estimativa sem premissa e N/D como zero', async () => {
    await expect(
      asUser(ownerA, () =>
        pg.query(
          "insert into public.evidence_items(organization_id,description,classification,confidence) values($1,'Afirmação','Fato validado','Alta')",
          [orgA],
        ),
      ),
    ).rejects.toThrow();
    await expect(
      asUser(ownerA, () =>
        pg.query(
          "insert into public.evidence_items(organization_id,description,classification,confidence) values($1,'Estimativa','Estimativa','Baixa')",
          [orgA],
        ),
      ),
    ).rejects.toThrow();
  });
  it('salva respostas, pausa, retoma e exige confirmação para concluir', async () => {
    const id = await asUser(
      ownerA,
      async () =>
        (
          await pg.query<{ id: string }>(
            'insert into public.diagnostic_sessions(organization_id) values($1) returning id',
            [orgA],
          )
        ).rows[0].id,
    );
    await asUser(ownerA, () =>
      pg.query(
        "insert into public.diagnostic_answers(organization_id,session_id,question_id,answer,unknown,is_draft) values($1,$2,'concern','N/D',true,false)",
        [orgA, id],
      ),
    );
    await asUser(ownerA, () =>
      pg.query("update public.diagnostic_sessions set status='paused' where id=$1", [id]),
    );
    expect(
      await asUser(
        ownerA,
        async () =>
          (
            await pg.query<{ answer: string }>(
              'select answer from public.diagnostic_answers where session_id=$1',
              [id],
            )
          ).rows[0].answer,
      ),
    ).toBe('N/D');
    await asUser(ownerA, () =>
      pg.query("update public.diagnostic_sessions set status='in_progress' where id=$1", [id]),
    );
    await expect(
      asUser(ownerA, () =>
        pg.query(
          "insert into public.diagnostic_answers(organization_id,session_id,question_id,answer,unknown) values($1,$2,'impact','0',true)",
          [orgA, id],
        ),
      ),
    ).rejects.toThrow();
    await expect(
      asUser(ownerA, () =>
        pg.query("update public.diagnostic_sessions set status='completed' where id=$1", [id]),
      ),
    ).rejects.toThrow();
  });
  it('salva objetivo confirmado, decisão e resultado de ação sem inventar valor ausente', async () => {
    const objectiveId = await asUser(
      ownerA,
      async () =>
        (
          await pg.query<{ id: string }>(
            "insert into public.global_objectives(organization_id,description,confirmed,confirmed_at) values($1,'Entender os atrasos',true,now()) returning id",
            [orgA],
          )
        ).rows[0].id,
    );
    await asUser(manager, () =>
      pg.query('update public.global_objectives set description=$1 where id=$2', [
        'Investigar os atrasos',
        objectiveId,
      ]),
    );
    expect(
      await asUser(
        manager,
        async () =>
          (
            await pg.query<{ created_by: string }>(
              'select created_by from public.global_objectives where id=$1',
              [objectiveId],
            )
          ).rows[0].created_by,
      ),
    ).toBe(ownerA);
    await asUser(ownerA, () =>
      pg.query('update public.decisions set objective_id=$1 where id=$2', [objectiveId, decisionA]),
    );
    const actionId = await asUser(
      manager,
      async () =>
        (
          await pg.query<{ id: string }>(
            "insert into public.action_items(organization_id,decision_id,title) values($1,$2,'Levantar informações') returning id",
            [orgA, decisionA],
          )
        ).rows[0].id,
    );
    await asUser(manager, () =>
      pg.query(
        "update public.action_items set status='Concluída',result='Registros reunidos' where id=$1",
        [actionId],
      ),
    );
    expect(
      await asUser(
        viewer,
        async () =>
          (
            await pg.query<{ result: string }>(
              'select result from public.action_items where id=$1',
              [actionId],
            )
          ).rows[0].result,
      ),
    ).toBe('Registros reunidos');
    expect(
      await asUser(
        viewer,
        async () =>
          (
            await pg.query<{ current_value: null }>(
              'select current_value from public.global_objectives where id=$1',
              [objectiveId],
            )
          ).rows[0].current_value,
      ),
    ).toBeNull();
  });
});
