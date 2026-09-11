-- A confirmed initial map is distinct from an approved analytical report.
alter table public.diagnostic_sessions add column initial_map_confirmed_at timestamptz;
alter table public.diagnostic_sessions drop constraint diagnostic_sessions_check;
alter table public.diagnostic_sessions add constraint diagnostic_sessions_check check (
  status <> 'completed' or
  (report is not null and report_approved_at is not null) or
  initial_map_confirmed_at is not null
);

-- Repair only v3 sessions with all ten saved answers and explicit human confirmation.
-- No answers, reports, or legacy sessions are removed or fabricated.
update public.diagnostic_sessions s
set status = 'completed', initial_map_confirmed_at = c.created_at
from public.diagnostic_answers c
where c.session_id = s.id and c.organization_id = s.organization_id
  and c.question_id = 'v3_p10_confirm' and c.answer = 'confirmed'
  and not c.is_draft and not c.unknown
  and s.initial_map_confirmed_at is null
  and (select count(distinct a.question_id) from public.diagnostic_answers a
    where a.session_id = s.id and a.organization_id = s.organization_id and not a.is_draft
    and a.question_id in ('v3_p1_focus','v3_p2_example','v3_p3_impact','v3_p4_goal',
      'v3_p5_deadline','v3_p6_blockers','v3_p7_radar','v3_p8_data','v3_p9_evidence','v3_p10_confirm')) = 10;
