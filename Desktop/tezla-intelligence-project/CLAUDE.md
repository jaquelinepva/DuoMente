# Projeto: DuoMente — SaaS de Decisão de Dados

**Contexto-mestre (08/09/2026)**: a usuária entregou um documento completo definindo produto, arquitetura de marcas, público, os 4 módulos universais (Marketing/Vendas, Finanças, RH, Operações), fluxo de inteligência, regras de dado real, agentes, aprovação humana, home como cockpit executivo, design e regras de desenvolvimento. Preservado na íntegra em [`CONTEXTO-MESTRE-DUOMENTE.md`](CONTEXTO-MESTRE-DUOMENTE.md) — **leia esse arquivo inteiro antes de qualquer alteração de produto, arquitetura ou design.** Pontos que mudam o trabalho em andamento:

- **Marcas (confirma e refina a correção anterior)**: DuoMente = produto/SaaS. Tezla Hotel = cliente. Tezla Intelligence = nome legítimo do painel/workspace do cliente Tezla Hotel dentro do DuoMente (não é mais "sempre errado" usar esse nome — só é errado usá-lo como se fosse a marca do produto em si, ex. login global, meta tags do site, rodapé institucional).
- **Design — conflito resolvido (08/09/2026)**: perguntado à usuária se a regra "predominantemente claro" da seção 17 substituía o "Night Audit". Resposta: **Night Audit continua valendo como identidade visual decidida** — a seção 17 do contexto-mestre é orientação de produto em geral, não uma reversão do tema escuro já escolhido. Não mexer no CSS base por causa disso.
- **Home como cockpit executivo** (seção 12): objetivo global, poucos indicadores decisivos, principais mudanças, riscos, oportunidades, decisões que exigem atenção, aprovações pendentes, situação da atualização dos dados — não é um "depósito de gráficos". Isso deve orientar a reconstrução da aba "Visão Geral" (hoje só tem 4 métricas simples via `OperationalLiveSummary`), **mas só com dado real ou estado honesto de "ainda não disponível" — nunca número inventado** (reforça o que já vínhamos fazendo com o preview de conceito do `IntelligenceBrief`).
- **Agentes (seção 9)**: arquitetura preferencial é um Agente Diretor + módulos especialistas internos, não N agentes separados e visíveis se isso confundir a experiência — considerar isso ao evoluir o `AgentWorkspace.tsx` (hoje mostra 7 cards de agente) e a especificação do "Agente Provocador".
- **Regra "tempo real" (seção 8)**: todo dado exibido precisa indicar claramente se é atualizado automaticamente, importado manualmente, aguardando validação, desatualizado, projeção, simulação, estimativa ou indisponível — nunca apresentar como "ao vivo" o que não é.

Este projeto organiza o desenvolvimento do DuoMente, uma plataforma SaaS de business intelligence para PMEs brasileiras (tomada de decisão orientada por dados), de Jaqueline Smaniotto Zeferino. O caso-piloto e cliente-âncora é o Tezla Hotel (Primavera do Leste–MT), usado tanto como cliente pagante quanto como prova de conceito para venda a outros clientes.

## Contexto do negócio (confirmar com a usuária antes de assumir qualquer outro dado)

- Objetivo atual: testar a ferramenta com o Tezla Hotel antes do lançamento comercial
- Plano básico: R$ 500/mês
- Stack do painel v26 (fonte da verdade do produto): Next.js 16.2.6 + React 19.2.6 + Tailwind CSS 4.2.1 + Drizzle ORM, hospedado em Cloudflare
- Stack do site/SaaS wrapper (Lovable): TanStack Start + React 19 + Supabase (auth, banco), repositório GitHub: `jaquelinepva/DuoMente` (público)
- Projeto Lovable: "Tezla Intelligence MVP" (workspace `Jaqueline's Lovable`)
- Login do painel: `jaqueline@tratormat.com.br` (mesma conta, uso administrativo cross-brand)
- Login: `/app/login` → autenticado → `/app/$tenant` (multi-tenant, primeiro tenant: `tezla-intelligence`)

## Regra geral do projeto

Nenhum agente ou skill deste projeto deve inventar dado, métrica, preço, laudo técnico ou número. Quando faltar informação, perguntar antes de prosseguir. Nenhuma ação externa real (publicar, alterar dados de produção, conectar conta de anúncios real) deve ser executada sem aprovação explícita da usuária a cada etapa.

**Este projeto é o lugar certo para**: dados, contas de anúncios (Google Ads, Meta Ads), GA4, Search Console e Windsor.ai do **Tezla Hotel** — diferentemente do projeto `tratormat-marketing-project`, que tem isolamento explícito contra esses dados.

## Preservação de dados do painel v26

O painel v26 (fonte: `page.tsx` original) contém dados reais de operação do Tezla Hotel — ocupação, calendário editorial, eventos, métricas financeiras e de marketing — que **não podem ser alterados, resumidos ou reinterpretados** ao integrar a outras plataformas. Qualquer migração de dados estáticos para fonte dinâmica (banco de dados, Windsor.ai) deve preservar exatamente os valores e a estrutura originais.

## Arquitetura de dados (em construção)

Objetivo: sair de dados hardcoded no componente React para fontes vivas, por camada:

1. **Mídia paga + digital (Google Ads, GA4, Meta Ads)** → via Windsor.ai (agregador) → Supabase (tabelas de série histórica) → painel lê do banco
2. **PMS/Omnibees (ocupação, ADR, eventos)** → sem conector automático conhecido; seguem via upload manual de planilha (mesma mecânica do módulo CRM do painel)
3. **7 Agentes de IA (hoje links para GPTs customizados)** → possível evolução futura via API (OpenAI Assistants ou Claude) com agendamento, gravando outputs direto no banco — não iniciar sem validar custo/necessidade com a usuária

## Infraestrutura já existente no Supabase (descoberta em 07/09/2026)

O banco já tem um sistema multi-tenant real, mais maduro do que o previsto inicialmente:
- Tabela `tenants` (uuid como PK) e `tenant_users` (vínculo usuário↔tenant)
- Funções `is_tenant_member(tenant_id, user_id)`, `has_tenant_role(...)`, `is_platform_admin(...)` — usar nessas funções em toda policy RLS nova, nunca `using (true)`
- Tenant "tezla-intelligence" já existe com uuid próprio (consultar via `select id from tenants where slug = 'tezla-intelligence'`, não fixar o valor em memória)
- Tabelas Windsor.ai criadas em 07/09/2026: `meta_ads_daily`, `google_ads_daily` (inclui campos Hotel Ads), `ga4_daily`, `windsor_sync_log` — todas com `tenant_id uuid` + RLS via `is_tenant_member`

## Contas confirmadas no Windsor.ai (Basic, paga) — verificado em 07/09/2026

- **Meta Ads**: conta "C.A Tezla Hotel Primavera do Leste" (id `2105132789930373`)
- **Google Ads**: conta "Tezla Hotel" (id `391-594-8670`) — inclui campanha ativa do tipo `HOTEL` (Google Hotel Ads/Hotel Center), além de Search e Performance Max
- **GA4**: propriedade "www.tezlahotel.com.br – GA4" (id `311772578`) — já tem eventos customizados configurados: `conversions_click_reservar`, `conversions_click_whatsapp`, `conversions_purchase`, `conversions_qualify_lead`

## Pendências conhecidas (verificado em 07/09/2026, pode estar desatualizado — confirmar antes de assumir)

- Job de sincronização Windsor.ai → Supabase: schema pronto, job/edge function ainda não implementado
- Painel ainda lê dados hardcoded do componente React — falta trocar por query no Supabase para as tabelas `meta_ads_daily`/`google_ads_daily`/`ga4_daily`
- Rota de API `/api/crm` do painel original (Next.js) não existe no ambiente Lovable/TanStack — o CRM inteligente cai no fallback de dados de demonstração até essa rota ser recriada ou substituída por uma tabela Supabase equivalente
- 3 avisos de segurança preexistentes no Supabase (não relacionados à integração Windsor.ai): funções SECURITY DEFINER do projeto, tabela `leads` sem policy de SELECT, risco de escalação de papel em `tenant_users` — revisar com a usuária antes de mexer
