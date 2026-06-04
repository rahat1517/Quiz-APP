-- Run this SQL in your Supabase project to update question storage and add the random question RPC.

-- 1. Add class_level to the existing questions table.
alter table if exists questions
  add column if not exists class_level integer not null default 6;

-- 2. Add RPC to fetch random questions for a specific class and optional subject.
create or replace function get_random_questions(
  p_class_level integer,
  p_subject text,
  p_limit integer
)
returns setof questions as $$
begin
  return query
  select *
  from questions
  where class_level = p_class_level
    and (p_subject is null or p_subject = 'All Subjects' or subject = p_subject)
  order by random()
  limit p_limit;
end;
$$ language plpgsql security definer;
