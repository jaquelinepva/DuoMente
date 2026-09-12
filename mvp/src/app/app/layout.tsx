import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Home, MessagesSquare, ListTodo, Building2, Users, Settings } from 'lucide-react';
import { signOut } from '@/app/actions';
import { IntelligenceNavigation } from '@/components/company-dashboard';
export const dynamic = 'force-dynamic';
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/app" aria-label="DuoMente — início">
          <Image src="/duomente-logo.svg" alt="DuoMente — Decisão Inteligente" width={246} height={64} priority />
        </Link>
        <nav aria-label="Menu principal">
          {[
            ['/app', 'Início', Home],
            ['/app/diagnostico', 'Diagnóstico', MessagesSquare],
            ['/app/decisoes', 'Decisões', MessagesSquare],
            ['/app/acoes', 'Ações', ListTodo],
            ['/app/empresa', 'Empresa', Building2],
            ['/app/equipe', 'Equipe', Users],
            ['/app/configuracoes', 'Configurações', Settings],
          ].map(([href, label, Icon]) => {
            const I = Icon as typeof Home;
            return (
              <Link href={href as string} key={href as string}>
                <I size={18} />
                {label as string}
              </Link>
            );
          })}
        </nav>
        <IntelligenceNavigation />
        <p className="sidebar-bottom">
          Entender.
          <br />
          Decidir.
          <br />
          Agir.
        </p>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <p className="eyebrow">SEU ESPAÇO DE DECISÃO</p>
          <div className="row">
            <span className="caption">{user.email}</span>
            <form action={signOut}>
              <button className="button button-ghost button-sm">Sair</button>
            </form>
          </div>
        </header>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
