# DuoMente — Diagnóstico v3

## 1. Objetivo do produto

O Diagnóstico v3 é a porta de entrada do DuoMente. Seu papel não é produzir uma consultoria completa a partir de um formulário. Ele deve entender, em linguagem simples, o que o empresário quer alcançar, onde acredita estar, o que o preocupa, quais dados já possui e quais informações ainda precisam ser obtidas.

O empresário não precisa conhecer termos como KPI, CAC, ROAS, margem de contribuição ou turnover. O DuoMente traduz a linguagem do empresário para uma estrutura de gestão.

Fluxo do produto:

**10 telas → confirmação humana → Mapa Inicial de Gestão → KPIs necessários → dados disponíveis/faltantes → coleta/conexões → KPIs reais → cockpit → decisões → acompanhamento.**

## 2. Princípios obrigatórios

1. Percepção não é fato.
2. Dado declarado não é dado validado.
3. Estimativa deve permanecer identificada como estimativa.
4. Valor ou unidade ambígua nunca pode ser normalizado sem confirmação humana.
5. “Não sei” é uma resposta válida e informativa.
6. O sistema não inventa benchmarks, metas, causas, ROI ou projeções.
7. Correlação não deve ser apresentada como causalidade.
8. O sistema não recomenda uma ação quando existe uma pergunta anterior capaz de mudar materialmente a recomendação.
9. O diagnóstico inicial identifica quais indicadores são necessários; não presume que esses indicadores já existam.
10. Estratégias surgem depois da validação dos dados, não diretamente da percepção inicial.

## 3. As 10 telas

### Tela 1 — Dor percebida
**Pergunta:** “Se você pudesse resolver UMA coisa nos próximos 90 dias, qual seria?”

Opções iniciais:
- Vender/faturar mais
- Reduzir custos ou fazer o dinheiro sobrar
- Parar de perder clientes
- Melhorar processos, atrasos ou erros
- Resolver problemas de equipe/pessoas
- Tenho dados, mas não sei o que fazer com eles
- Não sei onde está o problema
- Outro

**Armazenar como:** percepção declarada. Nunca como causa confirmada.

### Tela 2 — Exemplo concreto
**Pergunta:** “Conte um exemplo real disso que aconteceu nos últimos 30 dias.”

A interface pode mostrar exemplos adaptados à resposta da Tela 1 e ao segmento da empresa, mas nunca sugerir números como se fossem do usuário.

**Armazenar como:** relato declarado, com texto original preservado.

### Tela 3 — Tamanho do impacto
**Pergunta:** “Você consegue estimar o tamanho desse impacto?”

Opções:
- Sim, aproximadamente R$ ___
- Consigo apenas uma faixa
- Consigo medir em outra unidade (clientes, horas, erros, pessoas etc.)
- Percebo o impacto, mas não sei calcular

Quando houver faixa financeira, oferecer faixas configuráveis. Todo valor não comprovado deve ser marcado como **Estimativa declarada**.

### Tela 4 — Situação atual e objetivo
**Pergunta:** “Onde você está hoje e onde gostaria de chegar?”

Os campos devem se adaptar à dor escolhida, sem exigir que o empresário conheça o nome do indicador.

Exemplos:
- “Quanto vende hoje por mês?” → “Quanto gostaria de vender?”
- “Quantos clientes tem/atende hoje?” → “Onde gostaria de chegar?”
- “Quanto tempo o processo leva hoje?” → “Quanto gostaria que levasse?”

Unidade e periodicidade devem ser explícitas.

**Regra crítica:** entradas como “50 mi”, “50k”, “meio milhão”, percentuais sem base ou unidade incerta devem ser tratadas como ambíguas e bloqueiam a confirmação até serem esclarecidas.

### Tela 5 — Prazo
**Pergunta:** “Quando você gostaria de chegar lá?”

Opções:
- 1–2 semanas
- 3–4 semanas
- 1–3 meses
- 3–6 meses
- Mais de 6 meses
- Ainda não sei

O prazo é declarado pelo empresário; não implica que seja viável.

### Tela 6 — Bloqueio percebido
**Pergunta:** “O que mais está impedindo isso hoje?”

Permitir múltipla escolha e depois solicitar **um bloqueio principal**.

Opções iniciais:
- Não tenho os números para entender o problema
- Sei o problema, mas não sei como resolver
- Falta dinheiro/caixa
- Falta tempo
- Falta equipe
- Falta conhecimento ou pessoa especializada
- Não sei por onde começar
- Outro

**Armazenar como:** bloqueio percebido, não causa comprovada.

### Tela 7 — Radar das quatro áreas
Uma única tela com quatro cards:

- Marketing e Vendas
- Finanças
- Operações/Processos
- Pessoas e RH

Para cada card:
- Verde — na minha percepção funciona bem
- Amarelo — merece atenção
- Vermelho — vejo um problema importante
- Cinza — não acompanho/não sei avaliar

A descrição das opções pode ser contextualizada por área em linguagem simples.

**Regra:** este radar é **Percepção do empresário**, nunca “nota de saúde empresarial”.

### Tela 8 — Dados disponíveis
**Pergunta:** “Quais desses números ou informações você realmente acompanha hoje?”

Mostrar primeiro os dados mais relacionados à dor e ao objetivo, e depois permitir expandir por área.

Categorias possíveis:
- vendas/clientes
- custos/financeiro
- operações
- pessoas/RH
- satisfação/clientes

Permitir “não acompanho nenhum desses dados”.

O sistema deve registrar existência declarada do dado, não seu valor nem sua confiabilidade.

### Tela 9 — Evidências e fontes
**Pergunta:** “Você tem algum dado ou documento que possa ajudar a comprovar o que respondeu?”

Opções:
- Enviar arquivo (PDF, Excel/CSV, imagem ou texto suportado)
- Informar sistema/fonte (ERP, planilha, GA4, Google Ads, Meta Ads, PMS etc.)
- Fazer isso depois

Uploads permanecem classificados até análise. A existência de um arquivo não autoriza presumir seu conteúdo.

### Tela 10 — Confirmação humana
Título: **“Antes de analisar, confirme se entendemos corretamente.”**

Exibir de forma editável:
- principal preocupação declarada
- exemplo informado
- impacto estimado/declarado
- situação atual
- objetivo declarado
- prazo
- bloqueio principal percebido
- radar percebido das quatro áreas
- dados que o usuário afirma possuir
- ambiguidades detectadas
- informações ainda desconhecidas

Ações:
- **Está correto**
- **Quero corrigir**

Somente após confirmação o objetivo e o mapa inicial podem ser tratados como base do diagnóstico.

## 4. Motor de esclarecimento adaptativo

Após a Tela 10, o sistema pode fazer **0 a 3 perguntas adicionais**.

Uma pergunta adicional só é permitida quando sua resposta puder alterar materialmente:
- uma conclusão;
- uma prioridade;
- um indicador necessário;
- ou uma decisão recomendada.

O motor deve priorizar, nesta ordem:
1. resolver ambiguidade;
2. resolver contradição;
3. obter dado necessário para uma decisão iminente.

Não perguntar por curiosidade ou para “completar cadastro”.

## 5. Mapa Inicial de Gestão

O resultado imediato do Diagnóstico v3 não é um diagnóstico definitivo nem um dashboard cheio de KPIs. É o **Mapa Inicial de Gestão**.

### Bloco A — Objetivo global declarado
- descrição simples;
- situação atual declarada;
- meta declarada;
- unidade;
- periodicidade;
- prazo;
- gap somente quando matematicamente calculável e sem ambiguidade.

### Bloco B — Onde acreditamos estar
Radar visual das quatro áreas, explicitamente rotulado **Percepção inicial do empresário**.

### Bloco C — O que sabemos
Separar:
- Fato validado;
- Dado declarado;
- Estimativa declarada.

### Bloco D — O que ainda não sabemos
Lista explícita de dados ausentes relevantes ao objetivo.

### Bloco E — Ambiguidades e conflitos
Nenhuma ambiguidade relevante pode desaparecer silenciosamente.

### Bloco F — O que precisamos acompanhar
Lista de **KPIs necessários**, não necessariamente disponíveis.

Cada KPI deve conter:
- nome interno técnico;
- nome simples exibido ao empresário;
- área;
- por que ele importa para o objetivo;
- dado necessário;
- fonte possível;
- status: `disponível`, `declarado`, `faltante`, `aguardando validação`;
- valor somente quando houver dado suficiente.

## 6. Motor de indicadores

O objetivo global determina o que precisamos medir. As quatro áreas contribuem para o mesmo objetivo.

Exemplo: objetivo “faturar R$ 50 mil/mês”. O motor pode identificar como necessários, dependendo do modelo de negócio e dos dados:

### Marketing e Vendas
- faturamento;
- clientes/vendas;
- ticket médio;
- conversão;
- recompra/retenção;
- origem das vendas;
- CAC/CPA/ROAS apenas quando houver dados suficientes.

### Finanças
- receita;
- custos;
- margem;
- caixa;
- resultado.

### Operações
- capacidade;
- tempo de processo/entrega;
- erros/retrabalho;
- custo operacional relevante.

### Pessoas e RH
- capacidade da equipe;
- quadro;
- entradas/saídas quando relevante;
- dependência do proprietário;
- custo de pessoas quando disponível e pertinente.

**Proibição:** a lista acima é catálogo de possibilidades, não conjunto obrigatório para toda empresa.

## 7. Percepção versus realidade baseada em dados

O produto deve manter dois estados distintos:

1. **Percepção inicial** — originada das respostas do empresário.
2. **Situação baseada em dados** — calculada apenas quando existirem dados suficientes e regras explícitas.

Exemplo de interface:

- Finanças — Percepção: Verde
- Finanças — Dados: Cinza / dados insuficientes

Nunca converter automaticamente Verde/Amarelo/Vermelho do questionário em score numérico de desempenho.

## 8. Coleta de dados após o diagnóstico

Após o Mapa Inicial, o DuoMente deve dizer em linguagem simples quais dados faltam e onde podem ser obtidos.

Prioridade de entrada:
1. integrações automáticas quando disponíveis;
2. importação de Excel/CSV/PDF/texto/imagem suportada;
3. entrada manual simples.

O sistema deve solicitar somente dados ligados a um objetivo, indicador ou decisão identificados.

## 9. Cockpit BI

O cockpit nasce do objetivo, não de um template fixo.

Hierarquia da Home:
1. **Onde queremos chegar** — objetivo global;
2. **Onde estamos** — valor atual validado/declarado e status da evidência;
3. **Gap** — quando calculável;
4. **Quatro áreas** — percepção + situação baseada em dados;
5. **Indicadores que realmente importam**;
6. **Dados faltantes que impedem conclusões**;
7. **Decisões pendentes**;
8. **Próxima ação recomendada**.

O empresário pode acessar detalhes técnicos, mas a Home deve priorizar significado decisório.

## 10. Motor de decisão

Perguntas do empresário podem ser simples, por exemplo:

> “Continuo investindo em Google Ads?”

O DuoMente deve traduzir a pergunta em dados necessários e responder somente com o que puder sustentar.

Formato de resposta decisória:
- **Recomendação atual**;
- **Por quê**;
- **Evidências usadas**;
- **O que ainda não sabemos**;
- **Confiança:** baixa/média/alta;
- **Próxima ação**;
- **Quando revisar a decisão**.

Se faltar um dado capaz de inverter a recomendação, o sistema deve dizer que ainda não é possível decidir e solicitar esse dado.

## 11. Contrato do relatório posterior

Depois que houver dados suficientes, o relatório analítico deve separar explicitamente:

1. **O que sabemos**;
2. **O que ainda não sabemos**;
3. **Hipóteses**;
4. **Conflitos/ambiguidades**;
5. **Relações entre as quatro áreas**;
6. **Até 3 prioridades**, cada uma com:
   - justificativa;
   - evidência;
   - impacto possível sem inventar ROI;
   - confiança;
   - dado faltante;
   - próxima ação;
7. **Plano inicial de 30 dias**.

Nenhuma prioridade pode existir apenas porque “parece uma boa prática”.

## 12. Critérios de aceite do Marco 2

O Marco 2 só é aprovado quando:

- [ ] um empresário consegue concluir as 10 telas-base em até 5 minutos em teste de uso;
- [ ] o sistema aceita “não sei” sem forçar números;
- [ ] ambiguidades relevantes bloqueiam confirmação ou são explicitamente resolvidas;
- [ ] percepção nunca aparece como fato validado;
- [ ] o Mapa Inicial apresenta objetivo, situação atual, gap quando possível e radar percebido;
- [ ] o sistema identifica KPIs necessários sem inventar seus valores;
- [ ] dados ausentes aparecem explicitamente;
- [ ] nenhuma meta externa/benchmark é inventada;
- [ ] no máximo 3 perguntas adaptativas são feitas e cada uma possui justificativa decisória;
- [ ] nenhuma recomendação é emitida quando falta um dado capaz de inverter materialmente a decisão;
- [ ] o fluxo é testado com pelo menos três empresas fictícias de segmentos diferentes;
- [ ] testes automatizados cobrem ambiguidade, hipótese, dado ausente, percepção versus fato e prioridade sem evidência.

## 13. Fora do escopo deste marco

Não implementar ainda:
- templates completos diferentes para cada segmento;
- dezenas de KPIs fixos;
- CRM completo;
- automações de marketing;
- benchmarks externos automáticos;
- score proprietário de maturidade sem metodologia validada;
- expansão visual extensa do dashboard antes de validar o Mapa Inicial.

Primeiro provar: **entender → confirmar → descobrir o que medir → buscar evidência → apoiar decisão.**
