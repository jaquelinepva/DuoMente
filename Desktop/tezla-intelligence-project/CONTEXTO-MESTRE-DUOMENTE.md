# CONTEXTO-MESTRE DO PROJETO DUOMENTE

> Recebido da usuária em 08/09/2026. Definições obrigatórias — não podem ser reinterpretadas.
> Preservado aqui na íntegra. Ver também `CLAUDE.md` para o resumo operacional e o histórico de decisões técnicas.

Antes de analisar, alterar ou desenvolver qualquer parte deste projeto, compreenda definitivamente a estrutura abaixo. Estas definições são obrigatórias e não podem ser reinterpretadas.

## 1. O que é o DuoMente

O DuoMente é um SaaS B2B de inteligência para gestão e tomada de decisão, voltado inicialmente para micro e pequenas empresas brasileiras.

Ele será comercializado para empresários que precisam compreender o próprio negócio e decidir melhor, mas que normalmente:

- possuem dados espalhados em planilhas, PDFs, sistemas, redes sociais e documentos;
- não têm uma equipe especializada em análise de dados;
- recebem relatórios, mas não sabem exatamente o que fazer com eles;
- administram a empresa de maneira fragmentada;
- têm dificuldade para conectar Marketing, Vendas, Finanças, RH e Operações;
- tomam decisões com informações incompletas, atrasadas ou sem interpretação;
- não precisam de mais gráficos, mas de clareza sobre prioridades, impactos e ações.

O DuoMente não deve ser tratado apenas como dashboard, CRM, BI, chatbot ou sistema de relatórios.

A proposta central é funcionar como um segundo cérebro de gestão para o empresário, combinando: dados; metas; regras de negócio; histórico; contexto da empresa; análise por inteligência artificial; julgamento; alertas; recomendações; acompanhamento das decisões.

O sistema deve transformar dados em entendimento e entendimento em ação.

## 2. Arquitetura correta das marcas e clientes

É obrigatório respeitar a seguinte hierarquia:

**DuoMente** — É o produto principal, o SaaS que será comercializado. A marca, o domínio, a autenticação geral, a arquitetura multiempresa e a estrutura tecnológica principal pertencem ao DuoMente.

**Tezla Hotel** — É um cliente do DuoMente e também o primeiro ambiente piloto do SaaS. O Tezla Hotel não é o DuoMente. O painel específico do Tezla pode ser identificado internamente como Tezla Intelligence, mas isso representa somente o centro de decisão do cliente Tezla Hotel dentro do DuoMente.

Portanto: DuoMente = produto/SaaS; Tezla Hotel = cliente; Tezla Intelligence = painel ou workspace de inteligência do cliente Tezla Hotel.

Indicadores como ocupação, diária média, RevPAR, reservas, reputação e canais hoteleiros pertencem exclusivamente ao ambiente do Tezla Hotel. Eles não fazem parte da estrutura universal do DuoMente.

**Tratormat** — É outro cliente e outro projeto. Deve possuir: ambiente próprio; login próprio; banco de dados próprio ou isolamento lógico completo; integrações próprias; identidade visual própria; metas próprias; agentes configurados para o negócio industrial; informações comerciais, financeiras e operacionais próprias.

A Tratormat não pode aparecer dentro do ambiente do Tezla Hotel. Dados, arquivos, usuários, campanhas, agentes, histórico, integrações e decisões de um cliente jamais podem ser misturados aos de outro cliente.

## 3. Público-alvo inicial

O público inicial do DuoMente são micro e pequenas empresas, especialmente aquelas em que o proprietário ou diretor ainda participa diretamente das decisões.

O sistema deve ser compreensível para empresários não técnicos. A experiência não pode depender do conhecimento de termos complexos de BI, ciência de dados ou inteligência artificial.

O empresário deve conseguir responder rapidamente: Como está a minha empresa? Estamos caminhando para atingir a meta? O que mudou? Por que isso aconteceu? Qual é o impacto? O que merece atenção agora? O que devo fazer? Quem deve executar? Até quando? Qual resultado esperamos? A ação executada funcionou?

## 4. Estrutura universal do DuoMente

A base do DuoMente é formada por quatro grandes áreas presentes na maioria das empresas: Marketing e Vendas; Finanças; Recursos Humanos; Operações.

Essas áreas não podem funcionar como painéis isolados. Elas precisam estar conectadas a um objetivo global da empresa.

Exemplo: Objetivo global: faturar R$ 4 milhões no ano com margem sustentável. A partir desse objetivo global, cada área recebe objetivos, metas, indicadores, responsáveis e planos de ação próprios.

### 4.1 Marketing e Vendas

Deve ajudar a empresa a entender e decidir sobre: geração de demanda; origem dos leads; campanhas; investimentos em mídia; alcance e engajamento; custo por lead; custo por aquisição; conversões; oportunidades comerciais; propostas; pipeline; vendas; ticket médio; taxa de conversão; retenção; carteira de clientes; previsão de receita; canais com melhor desempenho; segmentos, regiões e públicos mais promissores; ações comerciais prioritárias.

O módulo não deve apenas dizer quantos leads ou vendas existiram. Deve explicar: quais canais contribuíram para o resultado; onde existe desperdício; onde há oportunidade; qual ação deve ser tomada; qual o impacto provável sobre receita, margem ou crescimento.

### 4.2 Finanças

Deve ajudar a empresa a compreender e decidir sobre: faturamento; receitas; despesas; custos fixos e variáveis; margem; fluxo de caixa; saldo disponível; contas a pagar; contas a receber; inadimplência; orçamento versus realizado; projeções; necessidade de capital; rentabilidade; impacto financeiro das decisões das demais áreas.

O Financeiro precisa se conectar com Marketing, Vendas, RH e Operações. Exemplos: uma campanha pode aumentar vendas, mas reduzir margem; uma contratação pode melhorar a operação, mas pressionar o caixa; um aumento de vendas pode exigir mais capacidade operacional; redução de custos pode prejudicar qualidade ou experiência do cliente.

### 4.3 Recursos Humanos

Deve ajudar a empresa a entender e decidir sobre: quantidade de colaboradores; custos de pessoal; absenteísmo; horas extras; turnover; produtividade; treinamento; desempenho; clima; dimensionamento de equipes; necessidade de contratação; riscos trabalhistas; impacto das pessoas nos resultados da empresa.

O módulo deve mostrar a relação entre equipe e desempenho empresarial, e não apenas apresentar dados cadastrais de funcionários.

### 4.4 Operações

Deve ajudar a empresa a entender e decidir sobre: produtividade; capacidade; eficiência; qualidade; desperdícios; prazos; retrabalho; custos operacionais; disponibilidade de recursos; estoque, quando aplicável; manutenção, quando aplicável; experiência do cliente; gargalos; riscos operacionais; impacto da operação sobre receita, margem e reputação.

Os indicadores operacionais devem ser personalizados conforme o segmento do cliente. Por exemplo: em hotelaria: ocupação, diária média, RevPAR, apartamentos disponíveis, chegadas, saídas, avaliações e custos por apartamento; em uma indústria: produção, capacidade, prazo, estoque, manutenção, desperdício, pedidos e margem por produto.

Esses indicadores pertencem aos clientes e segmentos específicos, não ao núcleo universal do DuoMente.

## 5. Objetivos, metas e indicadores

Todo cliente deve começar pela definição de: objetivo global; objetivos por área; metas; indicadores; responsáveis; prazos; limites de alerta; fontes dos dados.

O DuoMente deve mostrar a relação entre os indicadores e as metas. Não basta exibir: "Ocupação: 48,6%." O sistema deve interpretar: "A ocupação está em 48,6%, abaixo da meta de 55%. A maior perda está concentrada nos fins de semana. Se o padrão continuar, a receita do mês poderá ficar abaixo da previsão. A ação recomendada é reforçar a campanha segmentada para sexta e sábado e revisar as tarifas desses dias."

Cada indicador deve, quando possível, apresentar: valor atual; meta; diferença para a meta; comparação histórica; tendência; origem do dado; data da última atualização; nível de confiabilidade; impacto; recomendação; responsável; prazo.

## 6. Fluxo de inteligência do DuoMente

O funcionamento do sistema deve seguir esta sequência: receber os dados; identificar o cliente e a área correta; validar o arquivo ou integração; verificar qualidade, período e consistência; normalizar os dados; comparar com metas, histórico e regras; detectar anomalias, riscos e oportunidades; investigar possíveis causas; analisar impactos sobre outras áreas; priorizar o que exige atenção; apresentar uma recomendação; indicar responsável, prazo e impacto esperado; solicitar aprovação humana quando necessário; registrar a decisão; acompanhar a execução; medir se a ação produziu resultado; alimentar o histórico de aprendizado da empresa.

A lógica central deve ser: **Dado → contexto → diagnóstico → impacto → decisão → ação → acompanhamento → aprendizado.**

## 7. Entrada e atualização de dados

O DuoMente deve permitir duas formas principais de entrada.

**Integrações automáticas** — Conexões com plataformas e sistemas autorizados pelo cliente, como: ferramentas de marketing; plataformas de anúncios; analytics; CRM; sistemas financeiros; sistemas operacionais; bancos de dados; outras fontes compatíveis.

**Caixa única de conversa e importação** — O usuário deve poder atualizar o painel por meio de uma caixa única de conversa, semelhante a um assistente, na qual seja possível: escrever ou colar informações; colar uma imagem; carregar Excel; carregar CSV; carregar PDF; carregar documentos; enviar relatórios; incluir observações e contexto.

O sistema deve: identificar o tipo de informação; sugerir cliente, área, período e indicadores relacionados; extrair os dados; apresentar uma prévia; apontar inconsistências; pedir confirmação; salvar somente após validação; registrar fonte, usuário, data e horário; preservar o histórico; permitir correção sem apagar silenciosamente versões anteriores.

Não criar diversos botões de importação espalhados pelo sistema. A entrada deve ser centralizada, simples e conversacional.

## 8. Regra sobre "tempo real"

O DuoMente não pode afirmar que um dado está em tempo real quando ele foi inserido manualmente ou quando a integração está desatualizada.

Deve diferenciar claramente: dado atualizado automaticamente; dado importado manualmente; dado aguardando validação; dado desatualizado; projeção; simulação; estimativa; dado não disponível.

Cada informação deve mostrar sua fonte e a data da última atualização.

Quando não houver dados suficientes, o sistema deve declarar isso. Nunca deve inventar números para preencher indicadores.

## 9. Agentes inteligentes

Os agentes são parte central da entrega do DuoMente. Eles não podem existir apenas como nomes, cards decorativos ou promessas comerciais. Cada agente precisa possuir: função; fontes de dados; regras; entradas; processamento; saídas; limites de atuação; ações permitidas; situações que exigem aprovação; histórico de execuções.

A arquitetura preferencial é utilizar um **Agente Diretor de IA** por execução, que coordena módulos especialistas internos conforme a necessidade.

Podem existir especialidades como: Marketing e Performance; Comercial e Receita; Finanças; Pessoas; Operações; Inteligência de Mercado; Radar Competitivo; Consolidação Executiva; Diagnóstico de Anomalias; Planejamento e Acompanhamento de Ações.

Esses módulos não precisam aparecer como agentes totalmente separados para o usuário se isso tornar a experiência confusa. O empresário pode conversar com um único núcleo inteligente, enquanto o DuoMente aciona internamente as especialidades necessárias.

Princípios obrigatórios: dados antes de agentes; regras antes de IA; uma execução deve gerar uma saída clara; gestão por exceção; recomendações baseadas em evidências; nenhuma ação sensível sem autorização; resultado apresentado dentro do DuoMente; não redirecionar o usuário para o ChatGPT; não fingir que um agente está funcionando se ele ainda não estiver conectado a dados e ações reais.

## 10. Aprovação humana e limites da IA

O DuoMente deve apoiar decisões, não assumir decisões sensíveis sem autorização.

Exigem aprovação humana, entre outras: alteração de preços; mudança de orçamento; publicação de campanhas; envio de e-mails; contato com clientes; contratação ou desligamento; contratos; posicionamento de marca; gestão de crise; ações com impacto financeiro relevante; decisões jurídicas ou trabalhistas; relacionamento com clientes e fornecedores.

A plataforma pode analisar, recomendar e preparar a ação, mas deve indicar claramente quando aguarda aprovação.

## 11. CRM dentro de Marketing e Vendas

O CRM deve fazer parte do módulo de Marketing e Vendas, especialmente em versões intermediárias ou avançadas do produto. Ele deve priorizar o que realmente ajuda o pequeno empresário a vender e se relacionar melhor.

Deve permitir, conforme o plano contratado: importar empresas e pessoas por planilha; separar pessoa física e pessoa jurídica; criar segmentos; registrar histórico de relacionamento; acompanhar leads e oportunidades; identificar quem deve ser contatado; explicar por que o contato é importante; sugerir quando fazer o contato; preparar mensagens; criar campanhas; criar landing pages; preparar e-mails de marketing; utilizar integrações de envio autorizadas; futuramente integrar WhatsApp somente por meio da API oficial da Meta; medir resultados; exigir aprovação antes de publicações ou envios.

O objetivo não é copiar todas as funções de sistemas grandes como RD Station. O objetivo é selecionar as funções que realmente ajudam o empresário a tomar decisões e gerar resultado.

## 12. Estrutura da página inicial

A Home deve funcionar como um cockpit executivo. Ela não deve ser um depósito de gráficos.

Deve mostrar prioritariamente: objetivo global; progresso em relação à meta; poucos indicadores realmente decisivos; principais mudanças do período; riscos; oportunidades; decisões que exigem atenção; impacto esperado; responsável; prazo; ações pendentes de aprovação; situação da atualização dos dados.

A pergunta principal da Home é: **O que o empresário precisa saber e decidir agora?**

As páginas internas podem aprofundar detalhes, históricos e indicadores de cada área.

## 13. Padrão de análise

Toda análise relevante deve procurar responder: O que aconteceu? Em relação a quê? Por que provavelmente aconteceu? Qual é o impacto? Qual área será afetada? O que pode acontecer se nada for feito? O que recomendamos? Quem deve agir? Até quando? Qual resultado esperamos? Como vamos medir se funcionou? Que pergunta estratégica o empresário deveria fazer?

A inteligência deve ser clara, visual, objetiva, profissional e provocativa.

Evitar textos genéricos como: "continue monitorando"; "busque melhorar os resultados"; "invista em estratégias"; "acompanhe os indicadores".

Toda recomendação deve ser específica, justificável e executável.

## 14. Relação entre as quatro áreas

O diferencial do DuoMente está em conectar as áreas.

Exemplos: Marketing gera demanda, mas Vendas precisa converter; Vendas aumenta receita, mas Finanças precisa avaliar margem e caixa; aumento da demanda pode exigir reforço na Operação; problemas operacionais podem gerar avaliações negativas e reduzir vendas; falta de equipe pode prejudicar atendimento, produtividade e reputação; corte de despesas pode melhorar o caixa e, ao mesmo tempo, prejudicar qualidade; aumento de faturamento sem margem não representa necessariamente crescimento saudável.

O sistema deve identificar conflitos entre metas e apontá-los ao empresário.

## 15. Arquitetura multiempresa

O DuoMente deve nascer como uma plataforma multiempresa. Cada cliente deve possuir isolamento completo de: usuários; dados; arquivos; banco; metas; indicadores; agentes; prompts; integrações; credenciais; campanhas; CRM; histórico; relatórios; identidade visual; permissões.

Toda informação deve estar vinculada a um identificador de cliente ou tenant. Nenhuma consulta pode retornar informações de outro cliente. Um usuário só pode visualizar ou trocar de empresa quando tiver permissão expressa para acessar mais de um ambiente.

## 16. Usuários e permissões

O sistema deve permitir diferentes níveis de acesso, como: administrador do DuoMente; proprietário da empresa; diretor; gestor de área; colaborador; analista; usuário somente leitura.

As permissões devem controlar: áreas visíveis; dados acessíveis; capacidade de importar; capacidade de editar; capacidade de aprovar; capacidade de executar ações; acesso a informações sensíveis; acesso a integrações; acesso ao histórico.

## 17. Experiência e design

O design deve ser: claro; **predominantemente claro, sem fundo preto como padrão**; clean; minimalista; estratégico; visual; profissional; intuitivo; responsivo; acessível; orientado à decisão.

A identidade principal é do DuoMente. A identidade do cliente pode aparecer como contexto do workspace, sem substituir a marca do SaaS.

A interface deve diferenciar visualmente: informação; alerta; risco; oportunidade; recomendação; decisão; ação; aprovação; resultado.

Não preencher páginas com informações irrelevantes apenas para parecer que o sistema possui mais recursos.

> ⚠️ **Conflito identificado em 08/09/2026**: esta regra contradiz diretamente o sistema visual "Night Audit" (fundo quase-preto #0b0d10, tema escuro como padrão) construído nas sessões anteriores após a usuária escolher essa direção via processo de design deliberado. Aguardando confirmação explícita da usuária sobre se isso é uma reversão intencional antes de qualquer alteração no CSS existente. Ver `CLAUDE.md`.

## 18. O que o DuoMente não deve ser

O DuoMente não deve se transformar em: um dashboard cheio de gráficos sem interpretação; um chatbot genérico; um CRM excessivamente complexo; um conjunto de agentes fictícios; um sistema específico de hotelaria; um painel exclusivo do Tezla; uma mistura de dados da Tezla e da Tratormat; um sistema que inventa dados; uma plataforma que promete automação sem conexão real; uma interface bonita sem funcionamento; um site que vende funções que o produto ainda não entrega.

## 19. Regra para desenvolvimento e alterações

Antes de alterar o projeto: audite o que já existe; identifique funcionalidades reais, incompletas e simuladas; preserve dados e funções válidas; verifique rotas, menus, botões e permissões; não remova funcionalidades sem justificativa; não misture dados de clientes; não substitua dados reais por exemplos; não crie números fictícios; execute a alteração em etapas; teste após cada etapa; valide desktop e mobile; informe o que foi concluído, o que ainda não funciona e o que depende de integração.

Seguir sempre a sequência: **executar → testar → validar.**

Não considerar uma função concluída apenas porque a interface foi criada. Uma funcionalidade só está pronta quando: recebe dados reais; processa corretamente; respeita permissões; gera a saída esperada; registra a ação; trata erros; foi testada.

## 20. Resultado esperado do produto

Ao acessar o DuoMente, o empresário não deve apenas enxergar o passado. Ele deve compreender: onde está; para onde está indo; o que está impedindo o resultado; quais riscos estão surgindo; quais oportunidades estão sendo perdidas; quais decisões precisam ser tomadas; qual decisão deve vir primeiro; qual impacto cada decisão pode gerar; quem deve executar; se as decisões anteriores funcionaram.

A promessa central do DuoMente deve ser sustentada pelo funcionamento real do produto: **O DuoMente conecta os dados das principais áreas da empresa, interpreta o que está acontecendo e ajuda o empresário a transformar informação em decisões e ações acompanháveis.**

Sempre preserve esta distinção: DuoMente é o SaaS. Tezla Hotel é um cliente. Tezla Intelligence é o centro de decisão específico do Tezla dentro do DuoMente. Tratormat é outro cliente, com ambiente completamente separado.
