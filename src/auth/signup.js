import { supabase } from "./supabase";

const signup = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;

  return data.user;
};
