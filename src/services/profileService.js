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

  // 1. First try to find profile by auth user id
  let { data: profileById, error: idError } = await supabase
    .from('profiles')
    .select('id,email,role,class_level')
    .eq('id', user.id)
    .maybeSingle();

  if (idError) {
    throw new Error(idError.message);
  }

  // 2. If not found by id, try to find profile by email
  let profile = profileById;

  if (!profile && user.email) {
    const { data: profileByEmail, error: emailError } = await supabase
      .from('profiles')
      .select('id,email,role,class_level')
      .eq('email', user.email)
      .maybeSingle();

    if (emailError) {
      throw new Error(emailError.message);
    }

    profile = profileByEmail;
  }

  // 3. If still no profile exists, return default user profile
  if (!profile) {
    return {
      id: user.id,
      email: user.email,
      role: 'user',
      class_level: null,
    };
  }

  // 4. Normalize role so Admin / ADMIN / admin all work
  return {
    ...profile,
    email: profile.email || user.email,
    role: String(profile.role || 'user').trim().toLowerCase(),
  };
}

export async function updateUserProfile(updates) {
  const { data, error } = await supabase.auth.updateUser({ data: updates });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}