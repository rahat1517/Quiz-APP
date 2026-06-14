import { supabase } from '../lib/supabaseClient';
import { normalizeChapter } from '../lib/normalizeChapter';
import { normalizeClassLevel } from '../lib/normalizeClassLevel';

// Frontend role checks are useful for UI gating,
// but Supabase row-level security must be configured
// server-side so only admins can insert/update/delete.

export async function getQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function addQuestion(question) {
  const payload = {
    ...question,

    // class_level now supports values like:
    // "6", "9", "BCS 44", "BCS 45", "Admission", etc.
    class_level: normalizeClassLevel(question.class_level),

    subject: String(question.subject || 'General').trim(),

    chapter: normalizeChapter(question.chapter || 'General'),

    question_text: String(question.question_text || '').trim(),

    option_a: String(question.option_a || '').trim(),
    option_b: String(question.option_b || '').trim(),
    option_c: String(question.option_c || '').trim(),
    option_d: String(question.option_d || '').trim(),

    correct_answer: String(question.correct_answer || '').trim().toUpperCase(),

    // explanation must be saved if database has this column
    explanation: String(question.explanation || '').trim(),
  };

  const { data, error } = await supabase
    .from('questions')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateQuestion(questionId, updates) {
  const payload = { ...updates };

  if (typeof payload.class_level !== 'undefined') {
    payload.class_level = normalizeClassLevel(payload.class_level);
  }

  if (typeof payload.subject !== 'undefined') {
    payload.subject = String(payload.subject || 'General').trim();
  }

  if (typeof payload.chapter !== 'undefined') {
    payload.chapter = normalizeChapter(payload.chapter || 'General');
  }

  if (typeof payload.question_text !== 'undefined') {
    payload.question_text = String(payload.question_text || '').trim();
  }

  if (typeof payload.option_a !== 'undefined') {
    payload.option_a = String(payload.option_a || '').trim();
  }

  if (typeof payload.option_b !== 'undefined') {
    payload.option_b = String(payload.option_b || '').trim();
  }

  if (typeof payload.option_c !== 'undefined') {
    payload.option_c = String(payload.option_c || '').trim();
  }

  if (typeof payload.option_d !== 'undefined') {
    payload.option_d = String(payload.option_d || '').trim();
  }

  if (typeof payload.correct_answer !== 'undefined') {
    payload.correct_answer = String(payload.correct_answer || '').trim().toUpperCase();
  }

  if (typeof payload.explanation !== 'undefined') {
    payload.explanation = String(payload.explanation || '').trim();
  }

  const { data, error } = await supabase
    .from('questions')
    .update(payload)
    .eq('id', questionId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteQuestion(questionId) {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getRandomQuestions(classLevel, subject, chapter, limit) {
  const safeClassLevel = normalizeClassLevel(classLevel);
  const safeSubject = subject && subject !== 'All Subjects' ? String(subject).trim() : null;
  const safeChapter =
    chapter && chapter !== 'All Chapters'
      ? normalizeChapter(chapter)
      : null;

  const safeLimit = Math.max(1, Number(limit) || 1);

  const { data, error } = await supabase.rpc('get_random_questions', {
    p_class_level: safeClassLevel,
    p_subject: safeSubject,
    p_chapter: safeChapter,
    p_limit: safeLimit,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.length) {
    return data;
  }

  // Supports older rows/accounts where one side stores "Class 9" and the other stores "9".
  let fallbackQuery = supabase.from('questions').select('*');

  if (safeSubject) {
    fallbackQuery = fallbackQuery.eq('subject', safeSubject);
  }

  if (safeChapter) {
    fallbackQuery = fallbackQuery.eq('chapter', safeChapter);
  }

  const { data: fallbackData, error: fallbackError } = await fallbackQuery;

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  return (fallbackData || [])
    .filter(
      (question) => normalizeClassLevel(question.class_level) === safeClassLevel
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, safeLimit);
}
