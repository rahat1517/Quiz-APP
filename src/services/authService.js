import { supabase } from '../lib/supabaseClient';

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUpWithEmail({ email, password, emailRedirectTo } = {}) {
  const redirectTarget =
    emailRedirectTo || window.location.origin + '/auth/callback';

  const { data, error } = await supabase.auth.signUp(
    { email, password },
    { emailRedirectTo: redirectTarget }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function resendSignupVerification(email) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: window.location.origin + '/auth/callback',
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}
