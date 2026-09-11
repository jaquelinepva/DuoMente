'use client';
import { displayV3Answer } from '@/lib/initial-map';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pauseDiagnostic } from '@/app/actions';
import { saveV3Answer } from '@/app/actions-v3';
import { Button } from '@/components/ui/button';
import { type V3Answer, type V3Question, v3Statuses } from '@/lib/diagnostic-v3';

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
  v3_p1_focus:'Principal preocupação',v3_p2_example:'Situação atual',v3_p3_impact:'Impacto estimado',v3_p4_goal:'Meta principal',
  v3_p5_deadline:'Prazo desejado',v3_p6_blockers:'Bloqueios percebidos',v3_p7_radar:'Percepção inicial da empresa',v3_p8_data:'Dados acompanhados',v3_p9_evidence:'Fontes/evidências',
};
export function DiagnosticV3Live({sessionId,question,answers,readOnly}:{sessionId:string;question:V3Question;answers:V3Answer[];readOnly:boolean}) {
  const router=useRouter(); const [pending,setPending]=useState(false); const [message,setMessage]=useState('');
  const [text,setText]=useState(''); const [single,setSingle]=useState(''); const [selected,setSelected]=useState<string[]>([]); const [primary,setPrimary]=useState(''); const [radar,setRadar]=useState<Record<string,string>>({});
  const [mode,setMode]=useState<'exact'|'range'|'other'|'unknown'>('range'); const [impact,setImpact]=useState(''); const [impactUnit,setImpactUnit]=useState('R$ por mês');
  const [target,setTarget]=useState('');
  const prior=useMemo(()=>answers.filter(a=>a.question_id!==question.id),[answers,question.id]);
  const toggle=(x:string)=>setSelected(v=>v.includes(x)?v.filter(i=>i!==x):[...v,x]);
  function answer(){
    if(question.kind==='single'||question.kind==='evidence') return single;
    if(question.kind==='text') return text.trim();
    if(question.kind==='impact') return JSON.stringify({mode,value:impact.trim(),unit:impactUnit.trim()});
    if(question.kind==='goal') return JSON.stringify({target:target.trim()});
    if(question.kind==='multi-priority') return JSON.stringify({selected,primary});
    if(question.kind==='radar') return JSON.stringify(radar);
    if(question.kind==='data') return JSON.stringify({selected});
    return 'confirmed';
  }
  function ready(){
    if(question.kind==='single'||question.kind==='evidence') return !!single;
    if(question.kind==='text') return !!text.trim();
    if(question.kind==='impact') return mode==='unknown'||!!impact.trim();
    if(question.kind==='goal') return !!target.trim();
    if(question.kind==='multi-priority') return selected.length>0&&!!primary;
    if(question.kind==='radar') return radarAreas.every(([k])=>v3Statuses.includes(radar[k] as (typeof v3Statuses)[number]));
    if(question.kind==='data') return selected.length>0;
    return true;
  }
  async function submit(unknown=false){if(pending)return;setPending(true);setMessage('Salvando…');try{const result=await saveV3Answer({session_id:sessionId,question_id:question.id,answer:unknown?'':answer(),unknown});if(result.completed){window.location.assign('/app/diagnostico');return;}router.refresh();}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível salvar.');setPending(false);}}
  async function pause(){const f=new FormData();f.set('id',sessionId);setPending(true);try{await pauseDiagnostic(f);}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível pausar.');setPending(false);}}
  return <section className="question">
    <p className="eyebrow">Pergunta {question.step} de 10</p><h2>{question.title}</h2><p className="muted">{question.help}</p>
    <fieldset disabled={pending||readOnly}>
      {(question.kind==='single'||question.kind==='evidence')&&<div className="choices">{question.options?.map(o=><button type="button" key={o} className={single===o?'choice selected':'choice'} onClick={()=>setSingle(o)}>{o}</button>)}</div>}
      {question.kind==='text'&&<label className="field">Sua resposta<textarea rows={5} maxLength={4000} value={text} onChange={e=>setText(e.target.value)}/></label>}
      {question.kind==='impact'&&<div className="stack"><div className="choices">{([['exact','Sei aproximadamente'],['range','Consigo dar uma faixa'],['other','Consigo medir em outra unidade'],['unknown','Não sei calcular ainda']] as const).map(([m,l])=><button type="button" key={m} className={mode===m?'choice selected':'choice'} onClick={()=>setMode(m)}>{l}</button>)}</div>{mode!=='unknown'&&<><label className="field">Valor ou faixa<input value={impact} onChange={e=>setImpact(e.target.value)} placeholder="Ex.: 10.000 ou 5.000–10.000"/></label><label className="field">Como você mede esse impacto?<input value={impactUnit} onChange={e=>setImpactUnit(e.target.value)} placeholder="Ex.: R$ por mês, clientes, horas"/></label></>}</div>}
      {question.kind==='goal'&&<div className="stack"><label className="field">Minha meta é<input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Ex.: 50.000"/></label><p className="caption">Informe o valor completo. O DuoMente relacionará essa meta ao que você disse querer melhorar.</p></div>}
      {question.kind==='multi-priority'&&<div className="stack"><div className="checkbox-group">{question.options?.map(o=><label key={o}><input type="checkbox" checked={selected.includes(o)} onChange={()=>toggle(o)}/>{o}</label>)}</div>{selected.length>0&&<label className="field">Qual é o principal bloqueio?<select value={primary} onChange={e=>setPrimary(e.target.value)}><option value="">Selecione</option>{selected.map(x=><option key={x}>{x}</option>)}</select></label>}</div>}
      {question.kind==='radar'&&<div className="stack">{radarAreas.map(([k,l])=><div className="panel" key={k}><strong>{l}</strong><div className="choices">{v3Statuses.map(s=><button type="button" key={s} className={radar[k]===s?'choice selected':'choice'} onClick={()=>setRadar(v=>({...v,[k]:s}))}>{s}</button>)}</div></div>)}<p className="caption">Verde = parece funcionar bem · Amarelo = merece atenção · Vermelho = vejo problema importante · Cinza = não acompanho/não sei avaliar.</p></div>}
      {question.kind==='data'&&<div className="checkbox-group">{dataOptions.map(o=><label key={o}><input type="checkbox" checked={selected.includes(o)} onChange={()=>toggle(o)}/>{o}</label>)}</div>}
      {question.kind==='confirm'&&<div className="stack"><div className="panel"><h3>O que entendemos até aqui</h3>{prior.map(a=><div className="list-row" key={a.question_id}><strong>{labels[a.question_id]??a.question_id}</strong><span>{displayV3Answer(a)}</span></div>)}</div><p className="muted">Confirmar significa que o resumo representa o que você quis informar. Percepções continuam sendo percepções até serem validadas por dados.</p></div>}
      <div className="row"><Button onClick={()=>submit()} disabled={!ready()}>{question.kind==='confirm'?'Está correto →':'Salvar e continuar →'}</Button>{question.kind!=='confirm'&&<Button variant="outline" onClick={()=>submit(true)}>Não sei responder</Button>}<Button variant="ghost" onClick={pause}>Salvar e pausar</Button></div>
    </fieldset><p role="status" aria-live="polite">{message}</p>
  </section>;
}
