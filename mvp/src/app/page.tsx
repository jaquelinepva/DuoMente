import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function Landing() {
  return (
    <>
      <header className="public-header">
        <Link href="/" className="brand">
          <span className="brand-mark">d.</span>DuoMente
        </Link>
        <nav>
          <Link href="/como-funciona">Como funciona</Link>
          <Link href="/login">Entrar</Link>
          <Button asChild>
            <Link href="/cadastro">
              Começar diagnóstico <ArrowUpRight size={18} />
            </Link>
          </Button>
        </nav>
      </header>
      <main id="main">
        <section className="hero">
          <div>
            <p className="eyebrow">INTELIGÊNCIA EMPRESARIAL · DO ENTENDIMENTO À AÇÃO</p>
            <h1>
              Você não precisa de mais dados.
              <br />
              <em>
                Precisa saber
                <br />o que decidir.
              </em>
            </h1>
            <p className="hero-description">
              O DuoMente entende a situação da sua empresa, organiza evidências e mostra quais
              decisões precisam da sua atenção.
            </p>
            <Button asChild>
              <Link href="/cadastro">
                Começar diagnóstico <ArrowRight size={20} />
              </Link>
            </Button>
            <p className="caption">Comece pelo seu negócio. Uma pergunta de cada vez.</p>
          </div>
          <aside className="decision-note">
            <p className="eyebrow">O PONTO DE PARTIDA É VOCÊ</p>
            <div className="note-line" />
            <h2>O que mais tira o seu sono na empresa hoje?</h2>
            <p>
              Antes de mostrar números, vamos entender o seu negócio e descobrir quais decisões
              precisam da sua atenção.
            </p>
            <div className="note-path">
              <span>Uma preocupação</span>
              <span>↓</span>
              <strong>Uma decisão mais clara</strong>
              <span>↓</span>
              <span>Um próximo passo</span>
            </div>
            <Link href="/cadastro">
              Vamos entender juntos <ArrowUpRight size={18} />
            </Link>
          </aside>
        </section>
        <section className="process container">
          <div className="section-title">
            <p className="eyebrow">CLAREZA TEM UM CAMINHO</p>
            <h2>
              Da pergunta certa
              <br />
              ao próximo passo.
            </h2>
          </div>
          <div className="steps">
            {[
              [
                'Entendemos o negócio',
                'Você conta o que acontece na empresa, com suas próprias palavras.',
              ],
              [
                'Validamos as informações',
                'Separamos o que sabemos, o que foi declarado e o que precisa ser investigado.',
              ],
              [
                'Priorizamos decisões',
                'Organizamos o que merece atenção. Você confirma as conclusões.',
              ],
              [
                'Acompanhamos ações',
                'Cada decisão ganha responsáveis, prazos e espaço para aprender.',
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span className="step-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="closing container">
          <p className="eyebrow">A EMPRESA É UM TODO</p>
          <h2>
            Vendas, finanças, operação e pessoas.
            <br />
            Conectadas ao mesmo objetivo.
          </h2>
          <p>
            Quando falta informação, a resposta é investigar. Quando há uma hipótese, ela aparece
            como hipótese. Você participa de cada decisão.
          </p>
          <Button asChild>
            <Link href="/cadastro">Começar diagnóstico →</Link>
          </Button>
        </section>
      </main>
      <footer className="public-footer">
        <span className="brand">DuoMente</span>
        <span>Clareza para decidir. Direção para agir.</span>
        <nav>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
        </nav>
      </footer>
    </>
  );
}
