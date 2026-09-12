# Revisão do PR #1 — Marco 1

Escopo: aplicação em `mvp/`, autenticação, autorização, RLS, variáveis de ambiente e geração por IA. Revisão realizada em 09/09/2026. A aprovação do código não equivale à liberação em produção.

## Correções da revisão

- OpenAI isolada em `src/lib/ai/report.ts` com `server-only`. A chave é lida no servidor; o navegador invoca uma Server Action autenticada. Nenhuma chave administrativa Supabase é necessária para a aplicação.
- Erros esperados da IA retornam mensagem segura ao formulário em produção. Falhas não geram relatório de demonstração e não apagam respostas.
- Consultas com erro impedem a geração, em vez de tratar falhas como ausência de evidência.
- Validação rejeita análises com áreas repetidas e referências inexistentes. As quatro áreas têm navegação e consultam os dados da empresa selecionada.
- Escrita exige papel explicitamente permitido. Redirecionamentos de autenticação usam `private, no-store`.

## Evidência e limites

26 testes locais passaram: 13 de PostgreSQL/RLS, 5 de domínio e 8 de geração por IA/Server Action com provedor simulado. TypeScript e ESLint passaram. Os testes remotos de isolamento foram executados com identidades sintéticas e rollback integral. O provedor simulado não comprova conectividade real com OpenAI nem a qualidade factual de uma resposta real.

O fluxo usa o JWT do usuário e filtros por organização, além de RLS. Políticas protegem tabelas e Storage privado; alterações de organização/autoria e vínculos cruzados são restringidos no banco. O diagnóstico não depende de extensão de navegador. A classificação de evidências é informada pelos usuários; a aplicação não certifica a veracidade dos documentos.

## Pendências que impedem declarar o marco concluído

1. Supabase ainda reporta `auth_leaked_password_protection`. Ativar em Auth ou executar `node scripts/enable-password-protection.mjs` com `SUPABASE_ACCESS_TOKEN` no ambiente administrativo local. O script verifica a configuração após alterá-la e não imprime o token. Não cadastrar esse token na aplicação/Vercel.
2. Configurar Vercel: repositório `jaquelinepva/DuoMente`, branch de produção `codex/duomente-mvp`, Root Directory `mvp`, preset Next.js. Nenhuma publicação foi feita nesta revisão.
3. Cadastrar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` com URL final, `OPENAI_API_KEY` como segredo do servidor e `OPENAI_MODEL`. Não usar prefixo `NEXT_PUBLIC_` para a chave OpenAI. Este projeto não requer `service_role`.
4. Configurar Site URL e redirects de Auth com a URL final. Testar confirmação e recuperação por e-mail.
5. Em produção, criar uma empresa fictícia genérica; testar login/logout, respostas e retomada, evidências, objetivo confirmado, relatório real por IA e as quatro áreas em desktop/mobile. Não carregar Tezla ou TratorMat.
6. Usar uma segunda conta sem vínculo para tentar ler e alterar os identificadores da empresa fictícia. Confirmar bloqueio também pela API/Storage. Retirar temporariamente a credencial de IA apenas em ambiente de teste para verificar a mensagem de falha e preservação dos dados.

Antes de usuários externos, também definir cotas/limites de geração por empresa e políticas operacionais de retenção e monitoramento. Não há aprovação independente de outro mantenedor registrada por este documento.

Referências oficiais: [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [API de configuração Auth](https://supabase.com/docs/reference/api/v1-update-auth-service-config).
