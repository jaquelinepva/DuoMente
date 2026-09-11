'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pauseDiagnostic } from '@/app/actions';
import { saveV3Answer } from '@/app/actions-v3';
import { Button } from '@/components/ui/button';
import { parseV3Answer, type V3Answer, type V3Question, v3Statuses } from '@/lib/diagnostic-v3';

const radarAreas = [
  ['marketing_sales', 'Marketing e Vendas'],
  ['finance', 'Finanças'],
  ['operations', 'Operações/Processos'],
  ['people', 'Pessoas e RH'],
] as const;
const dataOptions = [
  'Faturamento/vendas do mês','Quantidade de clientes/vendas','Ticket médio/valor médio por venda','Clientes que voltam/recompram',
  'Custos com fornecedores/estoque','Salários e encargos','Custos fixos','Lucro/margem','Fluxo de caixa/saldo',
  'Tempo do processo principal','Erros, atrasos ou retrabalho','Entradas e saídas de pessoas','Satisfação/reclamações de clientes','Não acompanho nenhum desses dados',
];
const labels: Record<string,string> = {
  v3_p1_focus:'Principal preocupação',v3_p2_example:'Exemplo informado',v3_p3_impact:'Impacto estimado',v3_p4_goal:'Situação atual e objetivo',
  v3_p5_deadline:'Prazo desejado',v3_p6_blockers:'Bloqueios percebidos',v3_p7_radar:'Percepção inicial da empresa',v3_p8_data:'Dados acompanhados',v3_p9_evidence:'Fontes/evidências',
};
function display(a: V3Answer) {
  if (a.unknown) return 'Não sei / dado ainda ausente';
  const p = parseV3Answer(a.answer);
  if (!p || typeof p !== 'object') return a.answer;
  if ('current' in p) { const x=p as {current?:string;target?:string;unit?:string;period?:string}; return `Hoje: ${x.current} ${x.unit} · Meta: ${x.target} ${x.unit} · ${x.period}`; }
  if ('mode' in p) { const x=p as {mode?:string;value?:string;unit?:string}; return x.mode==='unknown'?'Não sei calcular ainda':`${x.value ?? ''} ${x.unit ?? ''}`.trim(); }
  if ('primary' in p) { const x=p as {primary?:string;selected?:string[]}; return `Principal: ${x.primary}. Outros: ${(x.selected ?? []).join(', ')}`; }
  if ('marketing_sales' in p) { const x=p as Record<string,string>; return radarAreas.map(([k,l])=>`${l}: ${x[k]}`).join(' · '); }
  if ('selected' in p) return ((p as {selected?:string[]}).selected ?? []).join(', ');
  return JSON.stringify(p);
}

export function DiagnosticV3Live({sessionId,question,answers,readOnly}:{sessionId:string;question:V3Question;answers:V3Answer[];readOnly:boolean}) {
  const router=useRouter(); const [pending,setPending]=useState(false); const [message,setMessage]=useState('');
  const [text,setText]=useState(''); const [single,setSingle]=useState(''); const [selected,setSelected]=useState<string[]>([]); const [primary,setPrimary]=useState(''); const [radar,setRadar]=useState<Record<string,string>>({});
  const [mode,setMode]=useState<'exact'|'range'|'other'|'unknown'>('range'); const [impact,setImpact]=useState(''); const [impactUnit,setImpactUnit]=useState('R$ por mês');
  const [current,setCurrent]=useState(''); const [target,setTarget]=useState(''); const [unit,setUnit]=useState('R$'); const [period,setPeriod]=useState('por mês');
  const prior=useMemo(()=>answers.filter(a=>a.question_id!==question.id),[answers,question.id]);
  const toggle=(x:string)=>setSelected(v=>v.includes(x)?v.filter(i=>i!==x):[...v,x]);
  function answer(){
    if(question.kind==='single'||question.kind==='evidence') return single;
    if(question.kind==='text') return text.trim();
    if(question.kind==='impact') return JSON.stringify({mode,value:impact.trim(),unit:impactUnit.trim()});
    if(question.kind==='goal') return JSON.stringify({current:current.trim(),target:target.trim(),unit:unit.trim(),period:period.trim()});
    if(question.kind==='multi-priority') return JSON.stringify({selected,primary});
    if(question.kind==='radar') return JSON.stringify(radar);
    if(question.kind==='data') return JSON.stringify({selected});
    return 'confirmed';
  }
  function ready(){
    if(question.kind==='single'||question.kind==='evidence') return !!single;
    if(question.kind==='text') return !!text.trim();
    if(question.kind==='impact') return mode==='unknown'||!!impact.trim();
    if(question.kind==='goal') return !!current.trim()&&!!target.trim()&&!!unit.trim()&&!!period.trim();
    if(question.kind==='multi-priority') return selected.length>0&&!!primary;
    if(question.kind==='radar') return radarAreas.every(([k])=>v3Statuses.includes(radar[k] as (typeof v3Statuses)[number]));
    if(question.kind==='data') return selected.length>0;
    return true;
  }
  async function submit(unknown=false){
    if(pending) return;
    setPending(true); setMessage('Salvando…');
    try{
      const result=await saveV3Answer({session_id:sessionId,question_id:question.id,answer:unknown?'':answer(),unknown});
      if(result.completed){
        // A confirmação final muda o estado da sessão no servidor. Um reload completo evita
        // uma segunda transição concorrente de Server Components, que em produção aparecia como React #441.
        window.location.assign('/app/diagnostico');
        return;
      }
      router.refresh();
    }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível salvar.'); setPending(false);}
  }
  async function pause(){const f=new FormData();f.set('id',sessionId);setPending(true);try{await pauseDiagnostic(f);}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível pausar.');setPending(false);}}
  return <section className="question">
    <p className="eyebrow">Pergunta {question.step} de 10</p><h2>{question.title}</h2><p className="muted">{question.help}</p>
    <fieldset disabled={pending||readOnly}>
      {(question.kind==='single'||question.kind==='evidence')&&<div className="choices">{question.options?.map(o=><button type="button" key={o} className={single===o?'choice selected':'choice'} onClick={()=>setSingle(o)}>{o}</button>)}</div>}
      {question.kind==='text'&&<label className="field">Seu exemplo<textarea rows={5} maxLength={4000} value={text} onChange={e=>setText(e.target.value)}/></label>}
      {question.kind==='impact'&&<div className="stack"><div className="choices">{([['exact','Sei aproximadamente'],['range','Consigo dar uma faixa'],['other','Consigo medir em outra unidade'],['unknown','Não sei calcular ainda']] as const).map(([m,l])=><button type="button" key={m} className={mode===m?'choice selected':'choice'} onClick={()=>setMode(m)}>{l}</button>)}</div>{mode!=='unknown'&&<><label className="field">Valor ou faixa<input value={impact} onChange={e=>setImpact(e.target.value)} placeholder="Ex.: 10.000 ou 5.000–10.000"/></label><label className="field">Unidade<input value={impactUnit} onChange={e=>setImpactUnit(e.target.value)}/></label></>}</div>}
      {question.kind==='goal'&&<div className="stack"><label className="field">Onde está hoje?<input value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Ex.: 32.000"/></label><label className="field">Onde quer chegar?<input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Ex.: 50.000"/></label><label className="field">Unidade<input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="Ex.: R$, clientes, dias"/></label><label className="field">Período<input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Ex.: por mês"/></label><p className="caption">Evite abreviações como “50 mi”. Escreva o valor e a unidade completos.</p></div>}
      {question.kind==='multi-priority'&&<div className="stack"><div className="checkbox-group">{question.options?.map(o=><label key={o}><input type="checkbox" checked={selected.includes(o)} onChange={()=>toggle(o)}/>{o}</label>)}</div>{selected.length>0&&<label className="field">Qual é o principal bloqueio?<select value={primary} onChange={e=>setPrimary(e.target.value)}><option value="">Selecione</option>{selected.map(x=><option key={x}>{x}</option>)}</select></label>}</div>}
      {question.kind==='radar'&&<div className="stack">{radarAreas.map(([k,l])=><div className="panel" key={k}><strong>{l}</strong><div className="choices">{v3Statuses.map(s=><button type="button" key={s} className={radar[k]===s?'choice selected':'choice'} onClick={()=>setRadar(v=>({...v,[k]:s}))}>{s}</button>)}</div></div>)}<p className="caption">Verde = parece funcionar bem · Amarelo = merece atenção · Vermelho = vejo problema importante · Cinza = não acompanho/não sei avaliar.</p></div>}
      {question.kind==='data'&&<div className="checkbox-group">{dataOptions.map(o=><label key={o}><input type="checkbox" checked={selected.includes(o)} onChange={()=>toggle(o)}/>{o}</label>)}</div>}
      {question.kind==='confirm'&&<div className="stack"><div className="panel"><h3>O que entendemos até aqui</h3>{prior.map(a=><div className="list-row" key={a.question_id}><strong>{labels[a.question_id]??a.question_id}</strong><span>{display(a)}</span></div>)}</div><p className="muted">Confirmar significa que o resumo representa o que você quis informar. Percepções continuam sendo percepções até serem validadas por dados.</p></div>}
      <div className="row"><Button onClick={()=>submit()} disabled={!ready()}>{question.kind==='confirm'?'Está correto →':'Salvar e continuar →'}</Button>{question.kind!=='confirm'&&<Button variant="outline" onClick={()=>submit(true)}>Não sei responder</Button>}<Button variant="ghost" onClick={pause}>Salvar e pausar</Button></div>
    </fieldset><p role="status" aria-live="polite">{message}</p>
  </section>;
}
