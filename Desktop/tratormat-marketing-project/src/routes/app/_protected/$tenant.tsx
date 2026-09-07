import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import "@/styles/tezla-v26.css";

type Tab = "operacao" | "financeiro" | "eficiencia" | "rh" | "concorrencia" | "fontes" | "eventos";
type CalendarItem = { id: number; date: string; title: string; channel: string; owner: string; status: string; priority: string; notes: string };
type OccupancyDay = { date: string; weekday: string; occupied: number; available: number; occupancy: number; arrivals: number; departures: number; delta?: number };

const tabs: { id: Tab; label: string }[] = [
  { id: "operacao", label: "MKT e Vendas" },
  { id: "financeiro", label: "Finanças" },
  { id: "eficiencia", label: "Operações" },
  { id: "eventos", label: "Eventos" },
  { id: "rh", label: "RH" },
  { id: "concorrencia", label: "Concorrência" },
  { id: "fontes", label: "Fontes" },
];

const agents = [
  { icon: "✏️", name: "Conteúdo", status: "Amarelo", desc: "Planeja comunicações para gerar demanda qualificada.", outputs: ["Calendário editorial", "Briefings", "Ofertas por segmento"] },
  { icon: "🎯", name: "Gestor de Tráfego", status: "Vermelho", desc: "Opera mídia paga com foco em reserva direta.", outputs: ["Campanhas", "Orçamento", "Termos e públicos"] },
  { icon: "▾", name: "Conversão", status: "Amarelo", desc: "Transforma visita e intenção em reserva.", outputs: ["Funil do site", "Testes de página", "Direto × OTA"] },
  { icon: "📊", name: "Performance", status: "Amarelo parcial", desc: "Monitora anomalias, diagnostica causas e recomenda ações.", outputs: ["Alertas", "Relatório semanal", "Diagnóstico"] },
  { icon: "🧭", name: "Inteligência de Mercado", status: "Amarelo", desc: "Monitora calendário, concorrência e oportunidades.", outputs: ["Radar competitivo", "Agenda da cidade", "Matriz de demanda"] },
  { icon: "📱", name: "Mídias Sociais", status: "Amarelo", desc: "Organiza produção, publicação e resposta social.", outputs: ["Grade", "Publicações", "Escalonamento"] },
  { icon: "🧑‍💼", name: "Supervisor MKT", status: "Amarelo", desc: "Arbitra prioridades e consolida o brief executivo.", outputs: ["Priorização", "Aprovar/Rejeitar/Adiar", "Veto de orçamento"] },
];

const initialCalendar: CalendarItem[] = [
  { id: -1, date: "2026-08-12", title: "Publicar reserva direta para a Expo Primavera", channel: "Instagram + Site", owner: "Marketing + Reservas", status: "Concluído", priority: "Alta", notes: "Disponibilidade comunicada sem desconto genérico." },
  { id: -2, date: "2026-08-13", title: "Ativar blitz para noites de baixa ocupação: 14–20 e 23–27/08", channel: "Comercial B2B + Reservas", owner: "Comercial", status: "Executar hoje", priority: "Crítica", notes: "A Expo ocorre apenas em 21–22 e 28–29/08. No intervalo, usar proposta corporativa, IFMT e long stay — não mensagem de escassez da Expo." },
  { id: -3, date: "2026-08-17", title: "Repor o bloco de artistas perdido para o Greenville", channel: "Revenue + Comercial", owner: "Jaqueline + Reservas + Comercial", status: "Executar hoje", priority: "Crítica", notes: "Cancelamento confirmado: a empresa responsável pelos artistas transferiu as reservas após receber patrocínio de R$ 50 mil." },
  { id: -6, date: "2026-08-18", title: "Validar conversões primárias do Google Ads e reserva-teste", channel: "Google Ads + GA4", owner: "Jaqueline", status: "Planejado", priority: "Crítica", notes: "Reserva concluída deve ser a conversão principal. Store visits, conversa iniciada e ação genérica não podem orientar CPA/ROAS." },
  { id: -9, date: "2026-08-18", title: "Verificar faturamento, saldo e entrega das campanhas", channel: "Google Ads", owner: "Jaqueline", status: "Executar hoje", priority: "Crítica", notes: "Há alerta de saldo e ausência de dados em 11–12/08." },
  { id: -10, date: "2026-08-18", title: "Conciliar as 5 conversões da campanha Expo", channel: "GA4 + Ads + PMS", owner: "Marketing + Reservas", status: "Executar hoje", priority: "Crítica", notes: "Validar transactionId, receita, origem/meio/campanha e existência de cinco reservas reais antes de escalar." },
  { id: -7, date: "2026-08-19", title: "Revisar pickup após 48h da campanha da Expo", channel: "Revenue + Mídia", owner: "Revenue + Marketing", status: "Planejado", priority: "Alta", notes: "Comparar 21–22 e 28–29/08; manter tarifa por noite e cortar mensagem que não gere reserva." },
  { id: -8, date: "2026-08-20", title: "Confirmar operação do primeiro fim de semana da Expo", channel: "Operações", owner: "Reservas + Governança + Café", status: "Planejado", priority: "Alta", notes: "Chegadas, café, estacionamento, apartamentos e equipe para 21–22/08." },
  { id: -4, date: "2026-08-24", title: "Retrospectiva do 1º fim de semana da Expo", channel: "Revenue", owner: "Revenue", status: "Planejado", priority: "Crítica", notes: "Reprecificar 28–29/08." },
  { id: -5, date: "2026-08-31", title: "Campanha de setembro", channel: "Mídia + B2B", owner: "Marketing + Comercial", status: "Planejado", priority: "Alta", notes: "Concursos, Corrida dos Ipês e plantio." },
  { id: 901, date: "2026-09-04", title: "Atualizar campanha permanente de reserva direta", channel: "Google Ads + Site", owner: "Marketing", status: "Em andamento", priority: "Crítica", notes: "Separar reservas com check-in em setembro das reservas efetivamente emitidas em setembro." },
  { id: 902, date: "2026-09-05", title: "Ação para o fim de semana da Independência", channel: "Instagram + Google + WhatsApp", owner: "Marketing + Reservas", status: "Planejado", priority: "Alta", notes: "Comunicar disponibilidade, café e estacionamento; evitar desconto geral sem testar demanda." },
  { id: 903, date: "2026-09-08", title: "Blitz corporativa para datas abaixo de 20%", channel: "Comercial B2B", owner: "Kassio + Reservas", status: "Planejado", priority: "Crítica", notes: "Priorizar empresas do agro, equipes técnicas, treinamentos e long stay." },
  { id: 904, date: "2026-09-14", title: "Campanha Tezla Corporate Meetings", channel: "Comercial + LinkedIn + WhatsApp", owner: "Marketing + Comercial", status: "Planejado", priority: "Alta", notes: "Apresentar sala + hospedagem + coffee break + estacionamento para entidades e empresas." },
  { id: 905, date: "2026-09-21", title: "Conteúdo institucional de sustentabilidade", channel: "Instagram + Google Perfil", owner: "Marketing", status: "Planejado", priority: "Média", notes: "Conectar o Dia da Árvore às práticas reais do Tezla: energia solar, reciclagem e redução de desperdícios." },
  { id: 906, date: "2026-09-24", title: "Prospecção durante o Workshop de IA do Sebrae", channel: "Comercial B2B", owner: "Jaqueline + Kassio", status: "Planejado", priority: "Alta", notes: "Abordar entidades e empresas com proposta Tezla Corporate Meetings; concorrente Lirius sediará o evento em 24–25/09." },
  { id: 907, date: "2026-09-27", title: "Dia Mundial do Turismo — posicionamento regional", channel: "Instagram + Google Perfil", owner: "Marketing", status: "Planejado", priority: "Média", notes: "Reforçar o Tezla como base corporativa do agro e apoio a quem movimenta Primavera do Leste." },
];

const occupancy: OccupancyDay[] = [
  { date:"04/09",weekday:"SEX",occupied:46,available:48,occupancy:48.9,arrivals:23,departures:1,delta:6.3 },
  { date:"05/09",weekday:"SÁB",occupied:47,available:47,occupancy:50.0,arrivals:11,departures:10,delta:-4.3 },
  { date:"06/09",weekday:"DOM",occupied:32,available:62,occupancy:34.0,arrivals:3,departures:18,delta:-5.4 },
  { date:"07/09",weekday:"SEG",occupied:12,available:81,occupancy:12.8,arrivals:2,departures:22,delta:0 },
  { date:"08/09",weekday:"TER",occupied:17,available:75,occupancy:18.1,arrivals:9,departures:4,delta:3.2 },
  { date:"09/09",weekday:"QUA",occupied:13,available:75,occupancy:13.8,arrivals:2,departures:6,delta:3.2 },
  { date:"10/09",weekday:"QUI",occupied:17,available:71,occupancy:18.1,arrivals:7,departures:3,delta:3.2 },
  { date:"11/09",weekday:"SEX",occupied:12,available:82,occupancy:12.8,arrivals:1,departures:6,delta:0 },
  { date:"12/09",weekday:"SÁB",occupied:13,available:81,occupancy:13.8,arrivals:3,departures:2,delta:0 },
  { date:"13/09",weekday:"DOM",occupied:13,available:81,occupancy:13.8,arrivals:2,departures:2,delta:0 },
  { date:"14/09",weekday:"SEG",occupied:16,available:78,occupancy:17.0,arrivals:5,departures:2,delta:1.0 },
  { date:"15/09",weekday:"TER",occupied:22,available:72,occupancy:23.4,arrivals:7,departures:1,delta:1.1 },
  { date:"16/09",weekday:"QUA",occupied:18,available:76,occupancy:19.1,arrivals:1,departures:5,delta:1.0 },
  { date:"17/09",weekday:"QUI",occupied:11,available:83,occupancy:11.7,arrivals:2,departures:9,delta:1.1 },
  { date:"18/09",weekday:"SEX",occupied:11,available:83,occupancy:11.7,arrivals:2,departures:2,delta:1.1 },
  { date:"19/09",weekday:"SÁB",occupied:11,available:83,occupancy:11.7,arrivals:1,departures:1,delta:-1.1 },
  { date:"20/09",weekday:"DOM",occupied:10,available:84,occupancy:10.6,arrivals:1,departures:2,delta:0 },
  { date:"21/09",weekday:"SEG",occupied:16,available:78,occupancy:17.0,arrivals:7,departures:1,delta:1.0 },
  { date:"22/09",weekday:"TER",occupied:14,available:80,occupancy:14.9,arrivals:0,departures:2,delta:1.1 },
  { date:"23/09",weekday:"QUA",occupied:14,available:80,occupancy:14.9,arrivals:0,departures:0,delta:1.1 },
  { date:"24/09",weekday:"QUI",occupied:14,available:80,occupancy:14.9,arrivals:0,departures:0,delta:1.1 },
  { date:"25/09",weekday:"SEX",occupied:15,available:79,occupancy:16.0,arrivals:2,departures:1,delta:1.1 },
  { date:"26/09",weekday:"SÁB",occupied:14,available:80,occupancy:14.9,arrivals:1,departures:2 },
  { date:"27/09",weekday:"DOM",occupied:8,available:86,occupancy:8.5,arrivals:0,departures:6 },
];

const events = [
  ["4513 · Unimed Cuiabá", "Cancelado", "R$ 9.350", "R$ 0", "10 RN · evento + hospedagem + A&B"],
  ["4516 · Belas Artes", "Realizado", "R$ 650", "R$ 650", "Locação de sala"],
  ["4485 · Boa Safra Sementes", "Realizado", "R$ 1.450", "R$ 1.450", "Sala + A&B"],
  ["4474 · Desafio Empreendedor", "Cancelado", "R$ 550", "R$ 0", "Locação de sala"],
  ["4504 · Reinaldo Preste", "Realizado", "R$ 700", "R$ 0", "Realizado sem receita lançada"],
  ["4515 · Guilherme Trevizan", "Realizado", "R$ 750", "R$ 750", "Locação de sala"],
  ["4487 · Somatech", "Cancelado", "R$ 550", "R$ 0", "Locação de sala"],
  ["4486 · Somatech", "Pendente", "R$ 0", "R$ 0", "Proposta sem valor registrado"],
  ["4523 · Jorge Gomes Martins", "Pendente", "R$ 450", "R$ 0", "2 room nights"],
  ["4522 · Marilda", "Realizado", "R$ 0", "R$ 0", "Evento realizado sem receita registrada"],
  ["4484 · Reny", "Pendente", "R$ 44.820", "R$ 0", "114 RN · 270 hóspedes"],
  ["4517 · Matheus & Kauan", "Pendente", "R$ 9.160", "R$ 0", "30 RN · 52 hóspedes"],
  ["4503 · Opertec Treinamentos", "Realizado", "R$ 750", "R$ 750", "Locação de sala"],
  ["4418 · Jads & Jadson", "Pendente", "R$ 5.270", "R$ 0", "18 RN · 29 hóspedes"],
  ["4510 · Rio Negro & Solimões", "Pendente", "R$ 5.650", "R$ 0", "19 RN · 29 hóspedes"],
  ["4509 · Rio Negro & Solimões", "Pendente", "R$ 5.950", "R$ 0", "19 RN · 31 hóspedes"],
  ["4511 · Simone Mendes", "Pendente", "R$ 7.580", "R$ 0", "28 RN · 40 hóspedes"],
  ["4505 · Allan Diego Gotardo", "Realizado", "R$ 23.060", "R$ 10.100", "Sala + A&B realizados; hospedagem não lançada"],
  ["4518 · Nattan Lima (staff)", "Pendente", "R$ 2.750", "R$ 0", "9 RN · 9 hóspedes"],
  ["4519 · Nattan Lima (banda)", "Pendente", "R$ 4.410", "R$ 0", "14 RN · 27 hóspedes"],
  ["4524 · Ana Paula Eberle", "Cancelado", "R$ 1.200", "R$ 0", "Sala · 28/08 · cancelamento confirmado no fechamento"],
  ["4507 · Maiara & Maraisa", "Pendente", "R$ 6.050", "R$ 0", "20 RN · 55 hóspedes"],
  ["4506 · Maiara & Maraisa (staff)", "Pendente", "R$ 2.980", "R$ 0", "10 RN · 16 hóspedes"],
  ["4526 · Thalita", "Pendente", "R$ 2.350", "R$ 0", "7 RN · 11 hóspedes"],
  ["4532 · Bayer", "Realizado", "R$ 1.275", "R$ 1.275", "Sala + A&B"],
  ["4537 · Eleição 2026 — Ligiane Moreira", "Realizado", "R$ 600", "R$ 600", "Locação de sala"],
];

const marketingMetrics = [
  { label: "GA4 · transações", value: "28", note: "+75,0% vs. julho · IDs únicos, ainda não conciliados com o motor", tone: "good" },
  { label: "Receita registrada GA4", value: "R$ 13.899,29", note: "+198,1% vs. julho · não equivale a receita confirmada no PMS", tone: "good" },
  { label: "Mídia paga total", value: "R$ 1.600,41", note: "Google R$ 1.398,35 + Meta R$ 202,06 · queda de 23,8%", tone: "good" },
  { label: "Conversão sessão → compra", value: "1,45%", note: "1.934 sessões · 767 engajadas · melhora de +0,33 p.p.", tone: "good" },
  { label: "Checkout → compra", value: "28,9%", note: "caiu de 43,2% em julho; gargalo na etapa final", tone: "bad" },
];

const hotelMonthlyHistory = [
  { month: "Jan/2026", occupancy: "42,55%", adr: "R$ 314,18", revpar: "—", total: "R$ 440.015,52" },
  { month: "Fev/2026", occupancy: "41,65%", adr: "R$ 310,18", revpar: "—", total: "R$ 404.144,23" },
  { month: "Mar/2026", occupancy: "45,64%", adr: "R$ 432,66", revpar: "—", total: "R$ 624.629,60" },
  { month: "Abr/2026", occupancy: "40,00%", adr: "R$ 311,90", revpar: "—", total: "R$ 397.946,67" },
  { month: "Mai/2026", occupancy: "40,00%", adr: "R$ 315,70", revpar: "—", total: "R$ 418.641,12" },
  { month: "Jun/2026", occupancy: "43,00%", adr: "R$ 305,89", revpar: "—", total: "R$ 416.138,21" },
  { month: "Jul/2026", occupancy: "39,19%", adr: "R$ 310,72", revpar: "—", total: "R$ 381.390,38" },
  { month: "Ago/2026", occupancy: "54,22%", adr: "R$ 323,24", revpar: "R$ 176,12", total: "R$ 560.636,75" },
];

const financialMonthlyHistory = [
  ["Jan", "R$ 440.015,52", "R$ 16.352,17", "3,72%", "25,49%"],
  ["Fev", "R$ 404.144,23", "R$ 25.733,81", "6,37%", "26,95%"],
  ["Mar", "R$ 624.629,60", "R$ 250.276,54", "40,07%", "17,87%"],
  ["Abr", "R$ 397.946,67", "−R$ 14.572,03", "−3,66%", "28,19%"],
  ["Mai", "R$ 418.641,12", "R$ 40.032,90", "9,56%", "33,17%"],
  ["Jun", "R$ 416.138,21", "R$ 9.009,97", "2,17%", "29,72%"],
  ["Jul", "R$ 381.390,38", "R$ 11.160,79", "2,93%", "27,43%"],
  ["Ago", "R$ 560.636,75", "R$ 102.800,81", "18,34%", "19,68%"],
];

const productivityMonthlyHistory = [["Jan","28","R$ 11.186,11","0%"],["Fev","25","R$ 9.714,01","−13%"],["Mar","25","R$ 22.803,19","+104%"],["Abr","26","R$ 12.895,86","+15%"],["Mai","22","R$ 15.254,22","+36%"],["Jun","20","R$ 17.788,49","+59%"],["Jul","23","R$ 13.166,76","+18%"],["Ago","23","R$ 21.762,91","+95%"]];
const satisfactionMonthlyHistory = [["Jan","79%","21%","3 / 14"],["Fev","96%","4%","2 / 53"],["Mar","97%","3%","2 / 100"],["Abr","95%","5%","3 / 69"],["Mai","83%","17%","9 / 59"],["Jun","72%","28%","11 / 41"],["Jul","85%","15%","3 / 20"],["Ago","91%","9%","não informado"]];

const competitorPatterns = [
  ["Agulhon", "Estrutura ampla e reputação local", "Piscina, sauna, restaurante, business center e eventos; ameaça por escala real, apesar de fragilidades em flexibilidade e instalações", "Muito alto"],
  ["Greenville", "Eventos e relacionamento", "Patrocínio financeiro para capturar blocos e vínculo com organizadores", "Alto"],
  ["Transamerica FIT", "Promoções e fidelidade", "Janelas curtas de desconto que antecipam reservas futuras no canal direto", "Alto"],
  ["ibis", "Preço para membros", "Benefício no canal direto apoiado pelo ecossistema ALL", "Médio-alto"],
  ["Lirius", "Eventos e relacionamento B2B", "Evoluiu de conteúdo de oportunidade para sediar capacitação institucional do Sebrae voltada a empresários", "Alto"],
  ["Tropical Garden", "Posicionamento corporativo genérico", "Já ocupa o rótulo Business Hotel, mas sem narrativa setorial específica", "Médio"],
  ["Barril", "Preço e longa permanência", "Atende viajante corporativo sensível a preço e oferece desconto para estadias longas", "Médio"],
  ["Hotel Primavera", "Econômico familiar", "Baixa evidência de estrutura B2B ou eventos no recorte analisado", "Baixo"],
];

const connections = [
  ["Google Ads","Fechamento 31/08","Confiável para mídia; atribuição parcial"],
  ["GA4","Fechamento 31/08","Ativo · atribuição parcial"],
  ["Meta Ads","Fechamento 31/08","Pausado · atribuição não conciliada"],
  ["Instagram","Indisponível","Bloqueado"],
  ["Google Meu Negócio","Automático","Confiável"],
  ["Search Console","Conectado / decisão de fonte","Com ressalva"],
  ["RDS / Desbravador","Fechamento final agosto · recebido 02/09","Confiável para desempenho mensal"],
  ["Motor Omnibees","Agosto fechado + estadias setembro emitidas em agosto","Confiável por data de emissão e check-in"],
  ["PMS / previsão","Atualizado em 04/09","Confiável para reservas futuras"],
  ["WhatsApp","Pendente","Bloqueado"],
];

function toneColor(tone: string) {
  if (tone === "good") return { bg: "#ecfdf5", color: "#047857" };
  if (tone === "bad") return { bg: "#fff1f2", color: "#be123c" };
  if (tone === "warn") return { bg: "#fffbeb", color: "#a16207" };
  return { bg: "#f1f5f9", color: "#526175" };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "1px solid #dce4ee", borderRadius: "16px", padding: "26px", marginBottom: "16px" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: "22px", color: "#172033", fontFamily: "Georgia, serif" }}>{title}</h2>
      {children}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #dce4ee" }}>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: "left", color: "#66758a", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", padding: "12px" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: "1px solid #eef2f7" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "14px 12px", color: "#4d5d72", fontSize: "13px" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Route = createFileRoute("/app/_protected/$tenant")({
  component: TezlaIntelligencePainel,
});

function TezlaIntelligencePainel() {
  const [selectedTab, setSelectedTab] = useState<Tab>("operacao");

  return (
    <div style={{ padding: "20px", background: "linear-gradient(180deg, #f8fbff 0, #f3f6fa 100%)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1540px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "14px 18px", background: "rgba(255,255,255,.82)", border: "1px solid rgba(220,228,238,.9)", borderRadius: "18px" }}>
          <div>
            <h1 style={{ margin: "0", fontSize: "24px", fontWeight: "bold", color: "#172033" }}>Tezla Intelligence</h1>
            <span style={{ color: "#66758a", fontSize: "12px" }}>Centro Executivo de Decisão</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "5px", marginBottom: "20px", background: "rgba(255,255,255,.94)", borderRadius: "16px", padding: "7px", flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setSelectedTab(t.id)} style={{ border: "none", background: selectedTab === t.id ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "transparent", color: selectedTab === t.id ? "white" : "#66758a", padding: "11px 17px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* MKT E VENDAS: Agentes + Métricas Marketing + Calendário */}
        {selectedTab === "operacao" && (
          <>
            <Panel title="7 Agentes de IA">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {agents.map((agent) => (
                  <div key={agent.name} style={{ background: "#f7f9fc", border: "1px solid #dce4ee", borderRadius: "14px", padding: "20px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "10px" }}>{agent.icon}</div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#172033" }}>{agent.name}</h3>
                    <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: "999px", background: "#eff6ff", color: "#2563eb", fontSize: "10px", fontWeight: 800, marginBottom: "10px" }}>{agent.status}</span>
                    <p style={{ color: "#4d5d72", lineHeight: 1.5, margin: "0 0 10px", fontSize: "13px" }}>{agent.desc}</p>
                    <ul style={{ paddingLeft: "18px", margin: 0, color: "#66758a", fontSize: "12px", lineHeight: 1.7 }}>
                      {agent.outputs.map((o) => <li key={o}>{o}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Métricas de Marketing Digital · Agosto/2026">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                {marketingMetrics.map((m) => {
                  const t = toneColor(m.tone);
                  return (
                    <div key={m.label} style={{ background: "#f7f9fc", border: "1px solid #dce4ee", borderRadius: "12px", padding: "16px" }}>
                      <span style={{ color: "#66758a", fontSize: "11px", textTransform: "uppercase" }}>{m.label}</span>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#172033", margin: "8px 0" }}>{m.value}</div>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", background: t.bg, color: t.color }}>{m.note}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Calendário Editorial · Ago–Set/2026">
              <div style={{ display: "grid", gap: "8px" }}>
                {initialCalendar.map((item) => (
                  <article key={item.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: "16px", alignItems: "start", padding: "14px 8px", borderTop: "1px solid #eef2f7" }}>
                    <time style={{ fontWeight: 800, color: "#2563eb", fontSize: "13px" }}>{item.date}</time>
                    <div>
                      <b style={{ display: "block", color: "#172033", marginBottom: "4px", fontSize: "14px" }}>{item.title}</b>
                      <span style={{ display: "block", color: "#66758a", fontSize: "12px", marginBottom: "6px" }}>{item.channel} · {item.owner}</span>
                      <p style={{ color: "#4d5d72", margin: 0, fontSize: "13px" }}>{item.notes}</p>
                    </div>
                    <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: "6px", background: item.status === "Concluído" ? "#ecfdf5" : item.status.includes("hoje") ? "#fff1f2" : "#fffbeb", color: item.status === "Concluído" ? "#047857" : item.status.includes("hoje") ? "#be123c" : "#a16207", fontSize: "11px", fontWeight: 800, whiteSpace: "nowrap" }}>{item.status}</span>
                  </article>
                ))}
              </div>
            </Panel>
          </>
        )}

        {/* FINANÇAS: Receita, Margem, Custo, ADR/RevPAR */}
        {selectedTab === "financeiro" && (
          <>
            <Panel title="Desempenho do Hotel · Histórico Mensal 2026">
              <DataTable
                headers={["Mês", "Ocupação", "ADR", "RevPAR", "Receita Total"]}
                rows={hotelMonthlyHistory.map(h => [h.month, h.occupancy, h.adr, h.revpar, h.total])}
              />
            </Panel>
            <Panel title="Receita, Margem e Custo Operacional · 2026">
              <DataTable
                headers={["Mês", "Receita", "Margem (R$)", "Margem (%)", "Custo Operacional (%)"]}
                rows={financialMonthlyHistory}
              />
            </Panel>
          </>
        )}

        {/* OPERAÇÕES: Ocupação diária + Produtividade/Satisfação */}
        {selectedTab === "eficiencia" && (
          <>
            <Panel title="Ocupação Diária · Previsão de Movimentação (04–27/09)">
              <div style={{ display: "grid", gap: "7px" }}>
                {occupancy.map((day) => (
                  <article key={day.date} style={{ display: "grid", gridTemplateColumns: "70px minmax(120px,1fr) 60px 85px 100px 70px", gap: "10px", alignItems: "center", padding: "10px 12px", borderRadius: "9px", background: "#f7f9fc", border: "1px solid #e5ebf2" }}>
                    <div>
                      <strong style={{ fontSize: "13px" }}>{day.date}</strong>
                      <span style={{ display: "block", color: "#66758a", fontSize: "11px" }}>{day.weekday}</span>
                    </div>
                    <div style={{ height: "9px", borderRadius: "999px", background: "#e4eaf2", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${day.occupancy}%`, background: day.occupancy > 50 ? "#0f9f6e" : "#2563eb", borderRadius: "999px" }} />
                    </div>
                    <strong style={{ fontSize: "13px" }}>{day.occupancy}%</strong>
                    <span style={{ color: "#4d5d72", fontSize: "12px" }}>{day.occupied} / {day.available}</span>
                    <span style={{ color: "#4d5d72", fontSize: "12px" }}>↑{day.arrivals} ↓{day.departures}</span>
                    <span style={{ color: "#66758a", fontSize: "12px", textAlign: "right" }}>{day.delta !== undefined ? (day.delta > 0 ? `+${day.delta}%` : `${day.delta}%`) : "—"}</span>
                  </article>
                ))}
              </div>
            </Panel>
            <Panel title="Produtividade por Colaborador · 2026">
              <DataTable headers={["Mês", "Pessoas", "Produtividade", "Variação"]} rows={productivityMonthlyHistory} />
            </Panel>
            <Panel title="Satisfação e Reclamações de Hóspedes · 2026">
              <DataTable headers={["Mês", "Satisfação", "Reclamações", "Reclamações/Total"]} rows={satisfactionMonthlyHistory} />
            </Panel>
          </>
        )}

        {/* EVENTOS: tabela completa */}
        {selectedTab === "eventos" && (
          <Panel title="Eventos · Orçado × Realizado (Agosto/2026)">
            <DataTable headers={["Evento", "Status", "Orçado", "Realizado", "Descrição"]} rows={events} />
          </Panel>
        )}

        {/* RH: placeholder honesto (dados ainda não recebidos no v26 original) */}
        {selectedTab === "rh" && (
          <Panel title="RH · Recursos Humanos">
            <div style={{ padding: "20px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px" }}>
              <p style={{ margin: 0, color: "#a16207", lineHeight: 1.6, fontSize: "14px" }}>
                <strong>Lacuna de gestão:</strong> quantidade de pessoas não é diagnóstico de RH. O painel ainda precisa receber turnover, absenteísmo, horas extras, custo da folha, treinamentos, clima e desempenho.
                Por ora, disponível apenas o denominador operacional (ver aba Operações → Produtividade por Colaborador).
              </p>
            </div>
          </Panel>
        )}

        {/* CONCORRÊNCIA: radar competitivo */}
        {selectedTab === "concorrencia" && (
          <Panel title="Radar Competitivo · 8 Concorrentes Mapeados">
            <DataTable headers={["Concorrente", "Padrão Observado", "Mecanismo", "Nível de Ameaça"]} rows={competitorPatterns} />
          </Panel>
        )}

        {/* FONTES: conexões de dados */}
        {selectedTab === "fontes" && (
          <Panel title="Fontes de Dados Conectadas">
            <DataTable headers={["Fonte", "Status", "Confiabilidade"]} rows={connections} />
          </Panel>
        )}

      </div>
    </div>
  );
}
