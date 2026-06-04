import { supabase } from '../lib/supabaseClient';

export async function saveQuizResult({
  subject,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  score,
  percentage,
  answers,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error('You must be logged in to save quiz result.');
  }

  const { data, error } = await supabase
    .from('quiz_results')
    .insert({
      user_id: user.id,
      subject,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      score,
      percentage,
      answers,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getMyQuizResults() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error('You must be logged in to view quiz results.');
  }

  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAllQuizResultsForAdmin() {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}