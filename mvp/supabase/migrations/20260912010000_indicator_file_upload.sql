-- Marco 3: permitir que um indicador tenha um arquivo fonte persistido no bucket evidence.
alter table public.indicator_data_points
  add column if not exists storage_path text;

alter table public.indicator_data_points
  add constraint indicator_data_points_storage_path_org_check
  check (
    storage_path is null
    or split_part(storage_path, '/', 1) = organization_id::text
  );
