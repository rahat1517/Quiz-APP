import { supabase } from '../lib/supabaseClient';

export async function getCurrentProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message);
  }

  const user = userData?.user;
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}

export async function updateUserProfile(updates) {
  const { data, error } = await supabase.auth.updateUser({ data: updates });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}
