import { supabase } from '../lib/supabaseClient';

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