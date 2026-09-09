import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
const titles: Record<string, string> = {
  login: 'Bom ter você por aqui.',
  cadastro: 'Seu próximo passo começa aqui.',
  'recuperar-senha': 'Recupere o acesso.',
  'como-funciona': 'Primeiro, entender. Depois, decidir.',
  privacidade: 'Privacidade',
  termos: 'Termos de uso',
};
export default async function PublicPage({ params }: { params: Promise<{ publicPage: string }> }) {
  const { publicPage: p } = await params;
  if (!titles[p]) notFound();
  return (
    <>
      <header className="public-header">
        <Link className="brand" href="/">
          DuoMente
        </Link>
        <Link href="/">Voltar ao início</Link>
      </header>
      <main id="main" className="narrow">
        <p className="eyebrow">DUOMENTE</p>
        <h1>{titles[p]}</h1>
        {['login', 'cadastro', 'recuperar-senha'].includes(p) ? (
          <>
            <AuthForm mode={p as 'login' | 'cadastro' | 'recuperar-senha'} />
            <div className="auth-links">
              <Link href="/login">Entrar</Link>
              <Link href="/cadastro">Criar conta</Link>
              <Link href="/recuperar-senha">Esqueci minha senha</Link>
            </div>
          </>
        ) : p === 'como-funciona' ? (
          <div className="prose">
            {[
              'Conte o que acontece na empresa. O diagnóstico começa com perguntas simples e salva suas respostas.',
              'Registre evidências e confirme seu objetivo global. Não saber uma resposta também ajuda a identificar o que investigar.',
              'Revise o relatório: fatos, dados declarados, hipóteses e informações ausentes são apresentados separadamente.',
              'Decida o que fazer. Registre responsáveis, prazos, resultados e aprendizados.',
            ].map((t, i) => (
              <p key={t}>
                <strong>{i + 1}.</strong> {t}
              </p>
            ))}
            <Link className="button" href="/cadastro">
              Começar diagnóstico
            </Link>
          </div>
        ) : (
          <div className="prose">
            <p>
              Versão inicial do produto. Este texto descreve o funcionamento implementado e precisa
              receber os dados do responsável pelo serviço antes da abertura pública.
            </p>
            {p === 'privacidade' ? (
              <>
                <p>
                  O DuoMente utiliza informações da conta, respostas de diagnóstico, evidências,
                  objetivos, decisões e ações para prestar o serviço. O acesso aos dados
                  empresariais depende da associação do usuário à empresa.
                </p>
                <p>
                  Ao gerar um relatório, o texto das respostas e dos registros de evidência da
                  empresa ativa é enviado ao provedor de IA. Arquivos anexados são armazenados de
                  forma privada; esta versão não extrai seu conteúdo automaticamente.
                </p>
                <p>
                  Supabase fornece autenticação e armazenamento; a aplicação é preparada para
                  hospedagem no Vercel e processamento de IA pela OpenAI. O prazo de retenção, o
                  canal de solicitações e a identificação do controlador ainda devem ser definidos
                  pelo responsável pelo serviço.
                </p>
              </>
            ) : (
              <>
                <p>
                  O DuoMente organiza informações e apoia decisões empresariais. O usuário revisa e
                  confirma conclusões, objetivos e decisões. Recomendações podem conter erros e
                  dependem da qualidade das informações registradas.
                </p>
                <p>
                  O usuário deve manter suas credenciais protegidas e registrar apenas informações
                  que tenha autorização para compartilhar com os membros da empresa e com o serviço.
                </p>
                <p>
                  O MVP não inclui cobrança, projeções financeiras, benchmarks ou execução
                  automática de ações. A identificação do prestador e as condições comerciais ainda
                  devem ser definidas antes da abertura pública.
                </p>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
