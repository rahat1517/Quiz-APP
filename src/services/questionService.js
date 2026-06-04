import { supabase } from '../lib/supabaseClient';

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

  return data;
}

export async function updateQuestion(questionId, updates) {
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', questionId)
    .select()
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

export async function addQuestion(question) {
  const { data, error } = await supabase
    .from('questions')
    .insert([question])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRandomQuestions(classLevel, subject, limit) {
  const { data, error } = await supabase.rpc('get_random_questions', {
    p_class_level: classLevel,
    p_subject: subject || null,
    p_limit: limit,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
