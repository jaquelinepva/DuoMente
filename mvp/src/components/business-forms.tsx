import { ActionForm, Field } from '@/components/form';
import { addEvidence, saveObjective } from '@/app/actions';
import { areas, classifications } from '@/lib/domain';
export function EvidenceForm() {
  return (
    <ActionForm action={addEvidence} label="Registrar evidência">
      <Field name="description" label="O que esta informação mostra?" required area />
      <label className="field">
        Classificação
        <select name="classification" defaultValue="Dado declarado">
          {classifications.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <Field name="source" label="Fonte — obrigatória para fato validado" />
      <Field name="period" label="Período a que a informação se refere" />
      <Field name="assumptions" label="Premissas — obrigatórias para estimativa" area />
      <label className="field">
        Confiança
        <select name="confidence" defaultValue="Baixa">
          <option>Baixa</option>
          <option>Média</option>
          <option>Alta</option>
        </select>
      </label>
      <label className="field">
        Anexo opcional (até 3 MB)
        <input name="file" type="file" accept=".pdf,.txt,.csv,.png,.jpg,.jpeg" />
      </label>
      <p className="caption">
        Registre a informação no texto acima. O conteúdo do anexo não é extraído automaticamente.
      </p>
    </ActionForm>
  );
}
export function ObjectiveForm({ value = {} }: { value?: Record<string, unknown> }) {
  return (
    <ActionForm action={saveObjective} label="Confirmar objetivo">
      <Field
        name="description"
        label="O que a empresa quer alcançar?"
        defaultValue={String(value.description ?? '')}
        required
        area
      />
      {[
        ['indicator', 'Indicador, se conhecido'],
        ['current_value', 'Valor atual, se conhecido'],
        ['target_value', 'Meta, se conhecida'],
        ['responsible', 'Responsável, se conhecido'],
        ['due_date', 'Prazo, se conhecido'],
      ].map(([name, label]) => (
        <Field
          key={name}
          name={name}
          label={label}
          type={name === 'due_date' ? 'date' : 'text'}
          defaultValue={String(value[name] ?? '')}
        />
      ))}
      <p>Áreas envolvidas</p>
      <div className="checkbox-group">
        {areas.map((a) => (
          <label key={a}>
            <input
              type="checkbox"
              name="areas"
              value={a}
              defaultChecked={Array.isArray(value.areas) && value.areas.includes(a)}
            />
            {a}
          </label>
        ))}
      </div>
      <label>
        <input type="checkbox" name="confirmed" required />
        Revisei e confirmo este objetivo global.
      </label>
      <p className="caption">Informações desconhecidas ficam como N/D. Não preencha com zero.</p>
    </ActionForm>
  );
}
