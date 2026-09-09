import Link from 'next/link';
import { notFound } from 'next/navigation';
import { context } from '@/lib/context';
import { db } from '@/lib/supabase/server';
import { ActionForm, Field } from '@/components/form';
import {
  createOrg,
  saveBusiness,
  selectOrg,
  manageMember,
  saveDecision,
  saveAction,
} from '@/app/actions';
import { areas } from '@/lib/domain';
import { dateBR, display } from '@/lib/utils';
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!['onboarding', 'empresa', 'equipe', 'configuracoes', 'decisoes', 'acoes'].includes(section))
    notFound();
  if (section === 'onboarding') {
    const client = await db();
    const {
      data: { user },
    } = await client.auth.getUser();
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">BEM-VINDO AO DUOMENTE</p>
          <h1>Vamos começar pela sua empresa.</h1>
          <p>Você será o proprietário deste espaço.</p>
        </div>
        <div className="panel">
          <ActionForm action={createOrg} label="Criar empresa e iniciar diagnóstico">
            <Field name="name" label="Nome da empresa" required />
            <Field name="industry" label="Segmento" required />
            <p className="caption">Conta: {user?.email}</p>
          </ActionForm>
        </div>
      </>
    );
  }
  const { client, org, user, role, members } = await context();
  const readOnly = role === 'viewer';
  if (section === 'configuracoes')
    return (
      <>
        <div className="page-heading">
          <h1>Configurações</h1>
          <p>Escolha a empresa em que deseja trabalhar.</p>
        </div>
        <ActionForm action={selectOrg} label="Usar esta empresa">
          <label className="field">
            Empresa ativa
            <select name="organization_id" defaultValue={org}>
              {members.map((m) => (
                <option key={m.organization_id} value={m.organization_id}>
                  {(m.organizations as unknown as { name: string })?.name ?? m.organization_id}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
        <p>
          <Link href="/app/onboarding">Criar outra empresa</Link>
        </p>
        <section className="panel">
          <h2>Sua conta</h2>
          <p>{user.email}</p>
          <p>
            Seu identificador para associação à equipe: <code>{user.id}</code>
          </p>
          <Link href="/recuperar-senha">Alterar senha por e-mail</Link>
        </section>
      </>
    );
  if (section === 'empresa') {
    const [{ data: business }, { data: organization }] = await Promise.all([
      client.from('business_profiles').select('*').eq('organization_id', org).maybeSingle(),
      client.from('organizations').select('*').eq('id', org).single(),
    ]);
    return (
      <>
        <div className="page-heading">
          <h1>{organization?.name}</h1>
          <p>{organization?.industry}</p>
        </div>
        {readOnly ? (
          <div className="panel">
            {Object.entries(business?.details ?? {}).map(([k, v]) => (
              <p key={k}>
                {k}: {display(v)}
              </p>
            ))}
          </div>
        ) : (
          <ActionForm action={saveBusiness} label="Salvar perfil da empresa">
            {[
              ['location', 'Cidade e estado'],
              ['operation_time', 'Tempo de operação'],
              ['people', 'Quantidade aproximada de pessoas'],
              ['products', 'Principais produtos ou serviços'],
              ['customers', 'Perfil dos clientes'],
              ['channels', 'Canais de venda'],
              ['revenue', 'Como a empresa gera receita'],
            ].map(([name, label]) => (
              <Field
                key={name}
                name={name}
                label={label}
                defaultValue={String(business?.details?.[name] ?? '')}
              />
            ))}
          </ActionForm>
        )}
      </>
    );
  }
  if (section === 'equipe') {
    const { data: team } = await client
      .from('organization_members')
      .select('*')
      .eq('organization_id', org);
    const roles: Record<string, string> = {
      owner: 'Proprietário',
      admin: 'Administrador',
      manager: 'Gestor',
      collaborator: 'Colaborador',
      viewer: 'Somente leitura',
    };
    return (
      <>
        <div className="page-heading">
          <h1>Equipe</h1>
          <p>O acesso depende de uma associação explícita à empresa.</p>
        </div>
        {team?.map((m) => (
          <div className="list-row" key={m.user_id}>
            <div>
              <strong>{m.user_id === user.id ? 'Você' : m.user_id}</strong>
              <p className="caption">{m.user_id}</p>
            </div>
            <span className="badge">{roles[m.role]}</span>
          </div>
        ))}
        {['owner', 'admin'].includes(role) && (
          <details>
            <summary>Adicionar membro ou alterar acesso</summary>
            <p>
              A pessoa deve criar uma conta e compartilhar seu identificador em Configurações.
              Nenhum convite é enviado automaticamente.
            </p>
            <ActionForm action={manageMember} label="Aplicar acesso">
              <Field name="user_id" label="Identificador do usuário" required />
              <label className="field">
                Permissão
                <select name="role" defaultValue="viewer">
                  {Object.entries(roles)
                    .filter(([r]) => r !== 'owner')
                    .map(([r, l]) => (
                      <option value={r} key={r}>
                        {l}
                      </option>
                    ))}
                  <option value="remove">Remover acesso</option>
                </select>
              </label>
            </ActionForm>
          </details>
        )}
      </>
    );
  }
  if (section === 'decisoes') {
    const { data } = await client
      .from('decisions')
      .select('*')
      .eq('organization_id', org)
      .order('updated_at', { ascending: false });
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">CENTRAL DE DECISÕES</p>
          <h1>O que precisa ser decidido?</h1>
          <p>Investigue, escolha e acompanhe o resultado.</p>
        </div>
        {data?.length ? (
          data.map((d) => (
            <div className="list-row" key={d.id}>
              <div>
                <Link href={`/app/decisoes/${d.id}`}>
                  <strong>{d.title}</strong>
                </Link>
                <p className="muted">
                  {d.area} · {display(d.responsible)} · {dateBR(d.due_date)}
                </p>
              </div>
              <span className="badge">{d.status}</span>
            </div>
          ))
        ) : (
          <p className="empty">
            Nenhuma decisão registrada. Comece com uma pergunta que precisa ser respondida.
          </p>
        )}
        {!readOnly && (
          <details>
            <summary>Registrar uma decisão</summary>
            <ActionForm action={saveDecision} label="Criar decisão">
              <Field name="title" label="Título" required />
              <Field name="question" label="Qual pergunta precisa ser respondida?" required area />
              <label className="field">
                Área principal
                <select name="area">
                  {areas.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <input type="hidden" name="status" value="Identificada" />
              <Field name="responsible" label="Responsável" />
              <Field name="due_date" label="Prazo" type="date" />
            </ActionForm>
          </details>
        )}
      </>
    );
  }
  const [{ data: actions }, { data: decisions }] = await Promise.all([
    client
      .from('action_items')
      .select('*')
      .eq('organization_id', org)
      .order('created_at', { ascending: false }),
    client.from('decisions').select('id,title').eq('organization_id', org),
  ]);
  const actionFields = (a: Record<string, string | null> = {}) => (
    <>
      <input type="hidden" name="id" value={a.id ?? ''} />
      <Field name="title" label="O que será feito?" defaultValue={a.title ?? ''} required />
      <Field name="responsible" label="Responsável" defaultValue={a.responsible ?? ''} />
      <Field name="due_date" label="Prazo" type="date" defaultValue={a.due_date ?? ''} />
      <label className="field">
        Decisão relacionada
        <select name="decision_id" defaultValue={a.decision_id ?? ''}>
          <option value="">Sem decisão vinculada</option>
          {decisions?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Status
        <select name="status" defaultValue={a.status ?? 'Pendente'}>
          {['Pendente', 'Em andamento', 'Concluída', 'Cancelada'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <Field name="result" label="Resultado observado" defaultValue={a.result ?? ''} area />
    </>
  );
  return (
    <>
      <div className="page-heading">
        <h1>Ações</h1>
        <p>Um plano é feito de próximos passos acompanháveis.</p>
      </div>
      {!actions?.length && (
        <p className="empty">Ainda não há ações. Registre a primeira quando definir o que fazer.</p>
      )}
      {actions?.map((a) => (
        <details key={a.id}>
          <summary>
            {a.title} · {a.status} · {dateBR(a.due_date)}
          </summary>
          {readOnly ? (
            <p>
              {display(a.responsible)} · {display(a.result)}
            </p>
          ) : (
            <ActionForm action={saveAction}>{actionFields(a)}</ActionForm>
          )}
        </details>
      ))}
      {!readOnly && (
        <details>
          <summary>Adicionar ação</summary>
          <ActionForm action={saveAction} label="Criar ação">
            {actionFields()}
          </ActionForm>
        </details>
      )}
    </>
  );
}
