# DuoMente MVP

Aplicação Next.js para diagnóstico empresarial, evidências, objetivos, decisões e ações. Idioma pt-BR. Identidade visual do briefing, sem dados demonstrativos ou gráficos decorativos.

## Estado da entrega

O código passou por build, lint, TypeScript, 18 testes locais e três cenários HTTP. A migração `20260909162906_duomente_mvp` foi aplicada no Supabase DuoMente. Testes transacionais no banco remoto verificaram isolamento, criação de empresa, membros e auditoria, com reversão integral dos dados de teste. O deploy Vercel e a validação dos fluxos reais de e-mail e IA permanecem pendentes.

Implementado:

- Landing e páginas públicas; cadastro, login, confirmação por código PKCE e recuperação de senha com Supabase Auth.
- Verificação de sessão no servidor, criação de empresa, troca da empresa ativa, associação explícita e papéis de acesso.
- Diagnóstico por perguntas, aprofundamento condicionado às respostas de cada área, rascunho automático, pausa com salvamento e retomada.
- Registro e classificação de evidências; anexos privados com limite de 3 MB e download por URL temporária.
- Objetivo global com confirmação humana e preservação de valores desconhecidos.
- Geração estruturada de relatório pela Responses API via Vercel AI SDK; Zod e validação de referências; confirmação humana e histórico.
- Central de Decisões, vínculo com evidências, plano de ações, responsáveis, prazos, resultados e aprendizados.
- RLS, chaves estrangeiras que incluem empresa, organização imutável e auditoria gerada pelo banco.

Limitações verificadas:

- Cadastro, entrega de e-mails, recuperação, gravação no Supabase remoto e geração real de IA ainda precisam de validação após configuração e migração.
- O aprofundamento das perguntas usa regras locais. A IA gera a análise final; não gera livremente cada pergunta seguinte.
- Arquivos são armazenados, mas seu conteúdo não é extraído. O usuário deve registrar a informação no texto da evidência.
- O perfil coletado nas respostas e o perfil editável em Empresa são fontes distintas; o relatório recebe ambos.
- Termos e privacidade são textos iniciais de funcionamento. Faltam identificação do prestador/controlador, contato e política de retenção antes de abrir o serviço ao público.
- O layout tem regras responsivas, foco, labels e navegação por teclado, mas não passou por inspeção visual em navegador nesta sessão.
- Não foram implementados os módulos excluídos pelo briefing: CRM, cobrança, especialistas, automações, benchmarks, projeções ou integrações comerciais.

## Executar

Requer Node.js 24 LTS e npm. As versões estão fixadas no `package.json` e no lockfile.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

No PowerShell, substitua `cp` por `Copy-Item`. Configure as variáveis abaixo e aplique a migração antes de usar o fluxo autenticado.

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável, protegida por RLS |
| `NEXT_PUBLIC_SITE_URL` | URL pública prevista para a instalação |
| `OPENAI_API_KEY` | Segredo somente no servidor; necessário para gerar relatórios |
| `OPENAI_MODEL` | Modelo com Responses API e saída estruturada; padrão `gpt-4.1-mini` |

Nenhuma chave `service_role` é necessária à aplicação. Não coloque segredos em variáveis `NEXT_PUBLIC_*`.

## Banco e migração para revisão

A migração aplicada está em `supabase/migrations/20260909162906_duomente_mvp.sql`. `supabase/schema.sql` mantém o mesmo SQL usado pelos testes locais. Não reaplique essa migração ao projeto existente. O histórico remoto já contém migrations anteriores, que devem ser sincronizadas antes de futuros comandos de `db push`. Consulte `supabase/REVIEW.md` para o alcance das alterações e `supabase/verify-remote.sql` para a verificação transacional.

## Autenticação

No Supabase Auth, habilite e-mail/senha e confirmação de e-mail. Configure Site URL com a URL final e permita os redirects exatos:

- `http://localhost:3000/login`
- `http://localhost:3000/recuperar-senha`
- `https://SEU-DOMINIO/login`
- `https://SEU-DOMINIO/recuperar-senha`

As telas usam o fluxo PKCE do Supabase SSR. Links devem ser abertos no navegador que iniciou o fluxo. Configure SMTP e valide o recebimento de confirmação e recuperação antes de abrir cadastros. Não houve envio de e-mails durante os testes desta entrega.

## Publicar no Vercel

O painel consultado mostrava um projeto existente chamado `visactor-nextjs-template`; ele não foi sobrescrito. Para uma implantação separada, importe este diretório como novo projeto Next.js no time DuoMente, ou execute a CLI Vercel autenticada neste diretório.

1. Aplique a migração aprovada e configure Auth.
2. Crie o projeto Vercel a partir do código deste diretório.
3. Defina as variáveis de ambiente no escopo Preview e Production.
4. Gere um Preview e valide cadastro → empresa → diagnóstico → relatório → decisão → ação.
5. Configure a URL definitiva no Supabase Auth e publique.

O ambiente desta sessão não disponibiliza controle do Chrome nem uma conexão Vercel autenticada para deploy. Para usar o painel aberto pelo agente, habilite ou atualize o plugin Codex Chrome no aplicativo desktop e reabra a barra lateral.

## Validação

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

- Vitest: regras de informação, adaptação das perguntas e PostgreSQL real local com papéis e RLS.
- Playwright: testes HTTP de páginas públicas, redirects de páginas protegidas e ausência de rotas fora do escopo. Esses testes não são uma validação visual nem um fluxo autenticado completo em navegador.
- Os testes de banco usam somente instâncias descartáveis locais. Não criam usuários nem empresas no Supabase remoto.

Fontes técnicas consultadas: [Next.js](https://nextjs.org/docs), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Vercel AI SDK](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text).
