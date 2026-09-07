"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "operacao" | "revenue" | "diario" | "mensal" | "financeiro" | "eventos" | "eficiencia" | "rh" | "alertas" | "agentes" | "calendario" | "concorrencia" | "fontes" | "plano";
type MarketingView = "indicadores" | "crm" | "performance" | "motor" | "calendario" | "eventos";
type CalendarItem = { id: number; date: string; title: string; channel: string; owner: string; status: string; priority: string; notes: string };
type Report = { id: number; observedAt: string; firstSeen: string; lastSeen: string; competitor: string; headline: string; actionType: string; mechanism: string; channel: string; target: string; commercialWindow: string; recurrence: string; confidence: string; status: string; change: string; whyItMatters: string; response: string; evidence: string; sourceUrl: string; alertLevel: string };
type OccupancyDay = { date: string; weekday: string; occupied: number; available: number; occupancy: number; arrivals: number; departures: number; delta?: number };

const tabs: { id: Tab; label: string }[] = [
  { id: "operacao", label: "MKT e Vendas" }, { id: "financeiro", label: "Finanças" },
  { id: "eficiencia", label: "Operações" }, { id: "rh", label: "RH" },
  { id: "concorrencia", label: "Concorrência" }, { id: "fontes", label: "Fontes" },
];

const agents = [
  { icon: "✏️", name: "Conteúdo", status: "Amarelo", desc: "Planeja comunicações para gerar demanda qualificada.", outputs: ["Calendário editorial", "Briefings", "Ofertas por segmento"] },
  { icon: "🎯", name: "Gestor de Tráfego", status: "Vermelho", desc: "Opera mídia paga com foco em reserva direta.", outputs: ["Campanhas", "Orçamento", "Termos e públicos"], url: "https://chatgpt.com/g/g-6a74dbb0acfc8191b7c9da12f8d6765b-gestor-de-trafego-pago-tezla-hotel" },
  { icon: "▾", name: "Conversão", status: "Amarelo", desc: "Transforma visita e intenção em reserva.", outputs: ["Funil do site", "Testes de página", "Direto × OTA"] },
  { icon: "📊", name: "Performance", status: "Amarelo parcial", desc: "Monitora anomalias, diagnostica causas e recomenda ações.", outputs: ["Alertas", "Relatório semanal", "Diagnóstico"] },
  { icon: "🧭", name: "Inteligência de Mercado", status: "Amarelo", desc: "Monitora calendário, concorrência e oportunidades.", outputs: ["Radar competitivo", "Agenda da cidade", "Matriz de demanda"], url: "https://chatgpt.com/g/g-6a8b10f449e08191a30c848f8a8d621f-tezla-radar-competitivo" },
  { icon: "📱", name: "Mídias Sociais", status: "Amarelo", desc: "Organiza produção, publicação e resposta social.", outputs: ["Grade", "Publicações", "Escalonamento"] },
  { icon: "🧑‍💼", name: "Supervisor MKT", status: "Amarelo", desc: "Arbitra prioridades e consolida o brief executivo.", outputs: ["Priorização", "Aprovar/Rejeitar/Adiar", "Veto de orçamento"] },
];

const initialCalendar: CalendarItem[] = [
  { id: -1, date: "2026-08-12", title: "Publicar reserva direta para a Expo Primavera", channel: "Instagram + Site", owner: "Marketing + Reservas", status: "Concluído", priority: "Alta", notes: "Disponibilidade comunicada sem desconto genérico." },
  { id: -2, date: "2026-08-13", title: "Ativar blitz para noites de baixa ocupação: 14–20 e 23–27/08", channel: "Comercial B2B + Reservas", owner: "Comercial", status: "Executar hoje", priority: "Crítica", notes: "A Expo ocorre apenas em 21–22 e 28–29/08. No intervalo, usar proposta corporativa, IFMT e long stay — não mensagem de escassez da Expo." },
  { id: -3, date: "2026-08-17", title: "Repor o bloco de artistas perdido para o Greenville", channel: "Revenue + Comercial", owner: "Jaqueline + Reservas + Comercial", status: "Executar hoje", priority: "Crítica", notes: "Cancelamento confirmado: a empresa responsável pelos artistas transferiu as reservas após receber patrocínio de R$ 50 mil. Levantar UHs, diárias e receita perdidas; depois substituir o bloco com vendas segmentadas para 21–22 e 28–29/08." },
  { id: -6, date: "2026-08-18", title: "Validar conversões primárias do Google Ads e reserva-teste", channel: "Google Ads + GA4", owner: "Jaqueline", status: "Planejado", priority: "Crítica", notes: "Reserva concluída deve ser a conversão principal. Store visits, conversa iniciada e ação genérica não podem orientar CPA/ROAS." },
  { id: -9, date: "2026-08-18", title: "Verificar faturamento, saldo e entrega das campanhas", channel: "Google Ads", owner: "Jaqueline", status: "Executar hoje", priority: "Crítica", notes: "Há alerta de saldo e ausência de dados em 11–12/08. Confirmar impressões, aprovação e veiculação antes de diagnosticar conversão." },
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

export default function TezlaIntelligencePainel() {
  const [selectedTab, setSelectedTab] = useState<Tab>("operacao");

  return (
    <div style={{ padding: "20px", background: "linear-gradient(180deg, #f8fbff 0, #f3f6fa 100%)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1540px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", padding: "14px 18px", background: "rgba(255,255,255,.82)", border: "1px solid rgba(220,228,238,.9)", borderRadius: "18px" }}>
          <div>
            <h1 style={{ margin: "0", fontSize: "24px", fontWeight: "bold", color: "#172033" }}>Tezla Intelligence</h1>
            <span style={{ color: "#66758a", fontSize: "12px" }}>Centro Executivo de Decisão</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "5px", marginBottom: "20px", background: "rgba(255,255,255,.94)", borderRadius: "16px", padding: "7px", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                border: "none",
                background: selectedTab === tab.id ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "transparent",
                color: selectedTab === tab.id ? "white" : "#66758a",
                padding: "11px 17px",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Agents Grid */}
        {selectedTab === "operacao" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {agents.map((agent) => (
              <div key={agent.name} style={{ background: "white", border: "1px solid #dce4ee", borderRadius: "16px", padding: "22px", boxShadow: "0 7px 22px rgba(23,32,51,.1)" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{agent.icon}</div>
                <h2 style={{ margin: "0 0 8px", fontSize: "18px", color: "#172033" }}>{agent.name}</h2>
                <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: "999px", background: "#f1f5f9", color: "#2563eb", fontSize: "11px", fontWeight: "800", marginBottom: "12px" }}>
                  {agent.status}
                </span>
                <p style={{ color: "#4d5d72", lineHeight: "1.55", margin: "0 0 12px" }}>{agent.desc}</p>
                <ul style={{ paddingLeft: "20px", margin: "0", color: "#66758a", fontSize: "12px", lineHeight: "1.8" }}>
                  {agent.outputs.map((output) => (
                    <li key={output}>{output}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Calendar Tab */}
        {selectedTab === "calendario" && (
          <div style={{ background: "white", border: "1px solid #dce4ee", borderRadius: "16px", padding: "26px" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: "23px", color: "#172033" }}>Calendário Editorial</h2>
            <div style={{ display: "grid", gap: "8px" }}>
              {initialCalendar.map((item) => (
                <article key={item.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "18px", alignItems: "start", padding: "18px 8px", borderTop: "1px solid #dce4ee" }}>
                  <time style={{ fontWeight: "800", color: "#2563eb" }}>{item.date}</time>
                  <div>
                    <b style={{ display: "block", color: "#172033", marginBottom: "8px" }}>{item.title}</b>
                    <span style={{ display: "block", color: "#66758a", fontSize: "12px", marginBottom: "8px" }}>{item.channel}</span>
                    <p style={{ color: "#4d5d72", margin: "0" }}>{item.notes}</p>
                  </div>
                  <div>
                    <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: "6px", background: item.status === "Concluído" ? "#ecfdf5" : "#fffbeb", color: item.status === "Concluído" ? "#047857" : "#a16207", fontSize: "11px", fontWeight: "800" }}>
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Occupancy Tab */}
        {selectedTab === "eficiencia" && (
          <div style={{ background: "white", border: "1px solid #dce4ee", borderRadius: "16px", padding: "26px" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: "23px", color: "#172033" }}>Ocupação Diária</h2>
            <div style={{ display: "grid", gap: "7px" }}>
              {occupancy.map((day) => (
                <article key={day.date} style={{ display: "grid", gridTemplateColumns: "74px minmax(130px,1fr) 66px 90px 105px 150px", gap: "12px", alignItems: "center", padding: "10px 12px", borderRadius: "9px", background: "#f7f9fc", border: "1px solid #e5ebf2" }}>
                  <div>
                    <strong>{day.date}</strong>
                    <span style={{ color: "#66758a", fontSize: "12px" }}>{day.weekday}</span>
                  </div>
                  <div>
                    <div style={{ height: "9px", borderRadius: "999px", background: "#e4eaf2", overflow: "hidden" }}>
                      <div style={{ display: "block", height: "100%", width: `${day.occupancy}%`, background: day.occupancy > 50 ? "#0f9f6e" : "#2563eb", borderRadius: "999px" }} />
                    </div>
                  </div>
                  <strong>{day.occupancy}%</strong>
                  <span style={{ color: "#4d5d72", fontSize: "12px" }}>{day.occupied} / {day.available}</span>
                  <span style={{ color: "#4d5d72", fontSize: "12px" }}>↑ {day.arrivals} / ↓ {day.departures}</span>
                  <span style={{ color: "#66758a", fontSize: "12px", textAlign: "right" }}>{day.delta !== undefined ? (day.delta > 0 ? `+${day.delta}%` : `${day.delta}%`) : "—"}</span>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {selectedTab === "financeiro" && (
          <div style={{ background: "white", border: "1px solid #dce4ee", borderRadius: "16px", padding: "26px" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: "23px", color: "#172033" }}>Eventos</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #dce4ee" }}>
                  <th style={{ textAlign: "left", color: "#66758a", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: ".07em", padding: "12px" }}>Evento</th>
                  <th style={{ textAlign: "left", color: "#66758a", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: ".07em", padding: "12px" }}>Status</th>
                  <th style={{ textAlign: "left", color: "#66758a", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: ".07em", padding: "12px" }}>Orçado</th>
                  <th style={{ textAlign: "left", color: "#66758a", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: ".07em", padding: "12px" }}>Realizado</th>
                  <th style={{ textAlign: "left", color: "#66758a", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: ".07em", padding: "12px" }}>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, idx) => (
                  <tr key={idx} style={{ borderTop: "1px solid #dce4ee" }}>
                    <td style={{ padding: "16px 12px", color: "#4d5d72", fontSize: "14px" }}>{event[0]}</td>
                    <td style={{ padding: "16px 12px", color: "#4d5d72", fontSize: "14px" }}>
                      <span style={{ padding: "4px 9px", borderRadius: "4px", background: event[1] === "Realizado" ? "#ecfdf5" : event[1] === "Cancelado" ? "#fff1f2" : "#fffbeb", color: event[1] === "Realizado" ? "#047857" : event[1] === "Cancelado" ? "#be123c" : "#a16207", fontSize: "11px", fontWeight: "800" }}>
                        {event[1]}
                      </span>
                    </td>
                    <td style={{ padding: "16px 12px", color: "#4d5d72", fontSize: "14px" }}>{event[2]}</td>
                    <td style={{ padding: "16px 12px", color: "#4d5d72", fontSize: "14px" }}>{event[3]}</td>
                    <td style={{ padding: "16px 12px", color: "#4d5d72", fontSize: "14px" }}>{event[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Placeholder para outras abas */}
        {(selectedTab === "revenue" || selectedTab === "diario" || selectedTab === "mensal" || selectedTab === "eventos" || selectedTab === "rh" || selectedTab === "alertas" || selectedTab === "agentes" || selectedTab === "concorrencia" || selectedTab === "fontes" || selectedTab === "plano") && (
          <div style={{ background: "white", border: "1px solid #dce4ee", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
            <p style={{ color: "#66758a", fontSize: "14px", lineHeight: "1.6" }}>
              Conteúdo da aba <strong>{tabs.find(t => t.id === selectedTab)?.label}</strong> será carregado aqui.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
