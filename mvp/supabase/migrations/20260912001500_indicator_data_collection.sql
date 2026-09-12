-- Marco 3: coleta e validação de dados ligados aos indicadores do Mapa Inicial.
create table public.indicator_data_points (
  id uuid primary key default gen_random_uuid(),
  organization_id bigint not null references public.organizations(id) on delete cascade,
  diagnostic_session_id uuid not null references public.diagnostic_sessions(id) on delete cascade,
  indicator_key text not null,
  source_type text not null check (source_type in ('manual','file','system')),
  source_label text,
  value_text text,
  period_label text,
  status text not null default 'received' check (status in ('received','validated','rejected')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  validated_at timestamptz,
  unique (organization_id, diagnostic_session_id, indicator_key, source_type)
);

alter table public.indicator_data_points enable row level security;
grant select, insert, update on public.indicator_data_points to authenticated;

create policy indicator_data_points_read on public.indicator_data_points
for select to authenticated
using (duomente_private.member_role(organization_id) is not null);

create policy indicator_data_points_insert on public.indicator_data_points
for insert to authenticated
with check (
  duomente_private.member_role(organization_id) in ('owner','admin','manager','collaborator')
  and created_by = (select auth.uid())
);

create policy indicator_data_points_update on public.indicator_data_points
for update to authenticated
using (duomente_private.member_role(organization_id) in ('owner','admin','manager','collaborator'))
with check (duomente_private.member_role(organization_id) in ('owner','admin','manager','collaborator'));

create index indicator_data_points_org_session_idx
  on public.indicator_data_points(organization_id, diagnostic_session_id);

create trigger duomente_touch before update on public.indicator_data_points
for each row execute function duomente_private.touch_record();

create trigger duomente_audit after insert or update or delete on public.indicator_data_points
for each row execute function duomente_private.audit_record();
