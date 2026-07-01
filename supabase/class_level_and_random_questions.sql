-- Run this SQL in your Supabase project to update question storage and add the random question RPC.

-- 1. Add class_level to the existing questions table.
alter table if exists questions
  add column if not exists class_level integer not null default 6;

-- 1.b Add chapter column to group questions by chapter/topic
alter table if exists questions
  add column if not exists chapter text default 'General';
-- 2. Add RPC to fetch random questions for a specific class and optional subject.
create or replace function get_random_questions(
  p_class_level integer,
  p_subject text,
  p_chapter text,
  p_limit integer
)
returns setof questions as $$
begin
  return query
  select *
  from questions
  where (
    (p_class_level in (9, 10) and regexp_replace(lower(trim(class_level::text)), '^class\s+', '') in ('9', '10'))
    or (p_class_level in (11, 12) and regexp_replace(lower(trim(class_level::text)), '^class\s+', '') in ('11', '12'))
    or (p_class_level not in (9, 10, 11, 12) and regexp_replace(lower(trim(class_level::text)), '^class\s+', '') = p_class_level::text)
  )
    and (p_subject is null or p_subject = 'All Subjects' or subject = p_subject)
    and (p_chapter is null or p_chapter = 'All Chapters' or chapter = p_chapter)
  order by random()
  limit p_limit;
end;
$$ language plpgsql security definer;

-- Compatibility overload for older schema cache / RPC signatures.
drop function if exists get_random_questions(text, integer, integer, text);

create or replace function get_random_questions(
  p_chapter_legacy text,
  p_class_level_legacy integer,
  p_limit_legacy integer,
  p_subject_legacy text
)
returns setof questions as $$
begin
  return query
  select *
  from get_random_questions(
    p_class_level_legacy,
    p_subject_legacy,
    p_chapter_legacy,
    p_limit_legacy
  );
end;
$$ language plpgsql security definer;
