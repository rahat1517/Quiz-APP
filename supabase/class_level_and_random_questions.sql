-- Quiz World: class levels and the random-question RPC.
--
-- Run in the Supabase SQL Editor. Safe to run more than once, on a new
-- project or on one that has the older integer-only version of this script.
--
-- Security: get_random_questions runs with the caller's permissions
-- (SECURITY INVOKER), so row-level security on `questions` still applies,
-- and only signed-in users may call it. Logged-out visitors (anon) can't,
-- because questions include correct_answer.

-- 1. Filtering columns. class_level is text so it can hold exam categories
--    like "BCS 45" as well as class numbers like "9".
alter table if exists questions
  add column if not exists class_level text not null default '6';

alter table if exists questions
  add column if not exists chapter text default 'General';

alter table if exists questions
  alter column class_level type text using class_level::text;

alter table if exists questions
  alter column class_level set default '6';

-- 2. Same rules as normalizeClassLevel() in src/lib/normalizeClassLevel.js:
--    "BCS 45" / "BCS-45" / "45 BCS" -> "BCS 45", "Class 9" -> "9".
create or replace function normalize_class_level(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select coalesce(
    'BCS ' || coalesce(
      (regexp_match(trim(p_value), '^bcs[-\s]*(\d+)', 'i'))[1],
      (regexp_match(trim(p_value), '^(\d+)[-\s]*bcs', 'i'))[1]
    ),
    (regexp_match(trim(p_value), '^class\s+(\d+)$', 'i'))[1],
    trim(coalesce(p_value, ''))
  );
$$;

-- 3. Remove the old integer versions. They must be dropped: PostgREST can't
--    choose between two functions with the same argument names.
drop function if exists get_random_questions(integer, text, text, integer);
drop function if exists get_random_questions(text, integer, integer, text);

-- 4. Same grouping as isClassInGroup() in src/lib/normalizeClassLevel.js.
create or replace function get_random_questions(
  p_class_level text,
  p_subject text,
  p_chapter text,
  p_limit integer
)
returns setof questions
language sql
stable
security invoker
set search_path = public
as $$
  select q.*
  from questions q
  where (
    case
      when normalize_class_level(p_class_level) ~* '^bcs$'
        then normalize_class_level(q.class_level) ~* '^bcs\s*\d+'
      when normalize_class_level(p_class_level) in ('9', '10')
        then normalize_class_level(q.class_level) in ('9', '10')
      when normalize_class_level(p_class_level) in ('11', '12')
        then normalize_class_level(q.class_level) in ('11', '12')
      else lower(normalize_class_level(q.class_level)) = lower(normalize_class_level(p_class_level))
    end
  )
    and (p_subject is null or p_subject = 'All Subjects' or q.subject = p_subject)
    and (p_chapter is null or p_chapter = 'All Chapters' or q.chapter = p_chapter)
  order by random()
  limit greatest(coalesce(p_limit, 1), 1);
$$;

-- 5. Permissions. Postgres lets every role (PUBLIC) execute a new function,
--    and Supabase also grants anon by default, so revoke both explicitly
--    before granting signed-in users.
revoke execute on function normalize_class_level(text) from public, anon;
revoke execute on function get_random_questions(text, text, text, integer) from public, anon;

grant execute on function normalize_class_level(text) to authenticated;
grant execute on function get_random_questions(text, text, text, integer) to authenticated;
