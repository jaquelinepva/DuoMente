import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
export async function context(write = false) {
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/login');
  const { data: members, error } = await client
    .from('organization_members')
    .select('organization_id,role,organizations(id,name)')
    .eq('user_id', user.id);
  if (error) throw new Error('Não foi possível carregar suas empresas.');
  const selected = (await cookies()).get('duomente-org')?.value;
  const member = members?.find((m) => String(m.organization_id) === selected) ?? members?.[0];
  if (!member) redirect('/app/onboarding');
  if (write && !['owner', 'admin', 'manager', 'collaborator'].includes(member.role))
    throw new Error('Seu acesso permite somente leitura.');
  return {
    client,
    user,
    org: Number(member.organization_id),
    role: String(member.role),
    member,
    members: members ?? [],
  };
}
