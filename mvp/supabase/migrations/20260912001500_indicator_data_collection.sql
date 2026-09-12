-- Marco 3: coleta e validação de dados ligados aos indicadores do Mapa Inicial.
create table public.indicator_data_points (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnostic_session_id uuid not null references public.diagnostic_sessions(id) on delete cascade,
  indicator_key text not null,
  source_type text not null check (source_type in ('manual','file','system')),
  source_label text,
  value_text text,
  period_label text,
  status text not null default 'received' check (status in ('received','validated','rejected')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  unique (organization_id, diagnostic_session_id, indicator_key, source_type)
);

alter table public.indicator_data_points enable row level security;

create policy indicator_data_points_select_member on public.indicator_data_points
for select using (public.is_org_member(organization_id));

create policy indicator_data_points_insert_editor on public.indicator_data_points
for insert with check (
  public.can_edit_org(organization_id)
  and created_by = auth.uid()
);

create policy indicator_data_points_update_editor on public.indicator_data_points
for update using (public.can_edit_org(organization_id))
with check (public.can_edit_org(organization_id));

create policy indicator_data_points_delete_admin on public.indicator_data_points
for delete using (public.is_org_admin(organization_id));

create index indicator_data_points_org_session_idx
  on public.indicator_data_points(organization_id, diagnostic_session_id);
