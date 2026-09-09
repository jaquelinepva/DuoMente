# Validação da entrega

Executada em 08 e 09/09/2026, Windows, Node.js 24.21.0.

| Verificação | Resultado |
| --- | --- |
| TypeScript strict (`npm run typecheck`) | Passou |
| ESLint (`npm run lint`) | Passou, sem erros |
| Vitest (`npm test`) | 26 testes passaram após revisão do PR |
| Next.js production build (`npm run build`) | Passou |
| Playwright HTTP | 3 cenários passaram; o encerramento do servidor exigiu intervenção no Windows |
| Migração remota | Aplicada: 20260909162906_duomente_mvp |
| Deploy Vercel | Não realizado |
| Fluxo real de IA | Não executado; chave OpenAI não configurada |
| E-mail de confirmação e recuperação | Não testado em produção |
| Inspeção visual desktop/celular | Não executada |

## Cobertura dos testes locais

Cinco testes de domínio verificam ausência versus zero, preservação de faixas, perguntas já respondidas, aprofundamento de áreas, fonte obrigatória para fatos, premissas para estimativas, confirmação humana do objetivo e referências do relatório.

Treze testes executam a migração e queries em uma instância PostgreSQL PGlite descartável. Usam os papéis `authenticated` e `anon` e uma implementação local de `auth.uid()` com claims de teste. Verificam isolamento de leitura/escrita, organização imutável, falta de vínculo, somente leitura, gestão de membros, proteção do proprietário, vínculos entre tabelas, histórico não adulterável, Storage privado, restrições de evidências, pausa/retomada, confirmação do diagnóstico e resultados das ações.

Os três cenários Playwright usam requisições HTTP, sem automação de navegador: sete rotas públicas respondem, nove rotas protegidas redirecionam sem autenticação e três rotas fora do escopo retornam 404.

Os testes remotos criaram identidades e empresas sintéticas dentro de uma transação integralmente revertida. Nenhum dado de teste persistiu. A validação local não substitui testes das configurações e integrações em Preview após migração e provisionamento.
