-- Integration checks with synthetic identities. Everything is rolled back.
begin;
select set_config('duomente.test_a',gen_random_uuid()::text,true);
select set_config('duomente.test_b',gen_random_uuid()::text,true);
select set_config('duomente.test_viewer',gen_random_uuid()::text,true);
select set_config('duomente.test_outsider',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('duomente.test_a')::uuid),(current_setting('duomente.test_b')::uuid),(current_setting('duomente.test_viewer')::uuid),(current_setting('duomente.test_outsider')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('duomente.test_a'),true);
select set_config('duomente.org_a',public.create_duomente_organization('Teste transacional A','Teste')::text,true);
select public.manage_duomente_member(current_setting('duomente.org_a')::bigint,current_setting('duomente.test_viewer')::uuid,'viewer');
insert into public.decisions(organization_id,title,question,area) values(current_setting('duomente.org_a')::bigint,'Decisão de teste A','Pergunta de teste','Operações');
select set_config('request.jwt.claim.sub',current_setting('duomente.test_b'),true);
select set_config('duomente.org_b',public.create_duomente_organization('Teste transacional B','Teste')::text,true);
insert into public.decisions(organization_id,title,question,area) values(current_setting('duomente.org_b')::bigint,'Decisão de teste B','Pergunta de teste','Operações');
do $$declare n integer;begin
 select count(*) into n from public.decisions where organization_id=current_setting('duomente.org_a')::bigint;if n<>0 then raise exception 'FAIL: cross tenant read';end if;
 update public.decisions set title='Intrusão' where organization_id=current_setting('duomente.org_a')::bigint;get diagnostics n=row_count;if n<>0 then raise exception 'FAIL: cross tenant update';end if;
 begin insert into public.action_items(organization_id,title) values(current_setting('duomente.org_a')::bigint,'Intrusão');raise exception 'FAIL: cross tenant insert';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('duomente.test_viewer'),true);
do $$declare n integer;begin
 select count(*) into n from public.decisions where organization_id=current_setting('duomente.org_a')::bigint;if n<>1 then raise exception 'FAIL: viewer read';end if;
 update public.decisions set title='Intrusão' where organization_id=current_setting('duomente.org_a')::bigint;get diagnostics n=row_count;if n<>0 then raise exception 'FAIL: viewer update';end if;
 begin perform public.manage_duomente_member(current_setting('duomente.org_a')::bigint,current_setting('duomente.test_viewer')::uuid,'admin');raise exception 'FAIL: privilege escalation';exception when raise_exception then if SQLERRM<>'Admin required' then raise;end if;end;
 begin delete from public.audit_logs where organization_id=current_setting('duomente.org_a')::bigint;raise exception 'FAIL: audit mutation';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('duomente.test_outsider'),true);
do $$begin if exists(select 1 from public.organizations) or exists(select 1 from public.decisions) then raise exception 'FAIL: outsider access';end if;end $$;
reset role;
rollback;
select 'PASS: organization creation, membership, tenant isolation, viewer permissions, audit protection; all fixtures rolled back' verification;
