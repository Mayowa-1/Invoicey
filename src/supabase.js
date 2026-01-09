import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dxrwjiianboisyvdfryo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cndqaWlhbmJvaXN5dmRmcnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzg0NjMsImV4cCI6MjA4MzQ1NDQ2M30.Pdc1iSvgXl6pqhMK0lYgVWhLWGdks_YHh8gvoq_g__0";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
