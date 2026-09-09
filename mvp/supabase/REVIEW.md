# Revisão da migração DuoMente MVP

Destino inspecionado: `zctzankypfvcjlzaiaal` (DuoMente). O projeto já possui organizações, membros, execuções de agentes e outros módulos com dados.

## Alterações em estruturas existentes

- `organizations`: adiciona `created_by` e uma política de leitura por vínculo explícito.
- `organization_members`: amplia a restrição de papel para incluir `collaborator`, adiciona autoria e atualização, índice de usuário, leitura dos membros da mesma empresa e auditoria de alterações.
- `agent_runs`: permite `agent_id` nulo para execuções do diagnóstico, adiciona autoria/atualização e políticas restritas às execuções manuais do novo fluxo; registra histórico das alterações.
- Storage: cria o bucket privado `evidence`, sem alterar `duomente-imports`, com políticas de leitura, upload e remoção dos próprios arquivos por papel autorizado.

Não há exclusão de dados ou de tabelas. Nenhuma política existente é removida. A alteração do check de papéis preserva todos os papéis encontrados. Ainda assim, mudanças de grants, triggers e constraints em tabelas compartilhadas exigem validação com os serviços existentes.

## Novas tabelas

`profiles`, `business_profiles`, `diagnostic_sessions`, `diagnostic_answers`, `evidence_items`, `global_objectives`, `decisions`, `decision_evidence`, `action_items`, `audit_logs`.

As tabelas empresariais usam `organization_id`. Relações de sessão, objetivo, decisão e evidência incluem o identificador da empresa para impedir vínculos cruzados. As tabelas novas têm RLS; alterações de empresa/autoria em registros existentes são recusadas por trigger. A auditoria é somente leitura para usuários.

## Funções privilegiadas

O schema não exposto `duomente_private` contém consulta de associação, criação transacional da empresa com proprietário, gestão de membros e auditoria. As funções de criação e gestão validam `auth.uid()` e permissões. Wrappers públicos são `SECURITY INVOKER`, com execução restrita a `authenticated`.

Somente Proprietário ou Administrador pode gerenciar membros. O proprietário não pode ser removido por essa operação; somente o proprietário pode conceder ou alterar acesso de administrador.

## Aplicação e verificação

Migração aplicada em 09/09/2026 após autorização do usuário: `20260909162906_duomente_mvp`. Todas as 13 tabelas do MVP estão com RLS habilitada e o bucket `evidence` está privado.

A verificação remota transacional passou para criação de organização, associação de membros, isolamento de leitura e escrita, somente leitura, bloqueio de escalada de privilégio e proteção da auditoria. Todas as identidades e empresas sintéticas foram revertidas.

O advisor de segurança não apontou falhas nas novas tabelas ou políticas. Registrou um aviso de configuração de Auth: proteção contra senhas vazadas desativada. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

O fluxo de login por navegador, entrega de e-mails, geração real de IA e publicação Vercel ainda dependem da configuração e validação no ambiente final.