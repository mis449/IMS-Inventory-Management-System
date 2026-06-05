import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL loaded:", supabaseUrl ? "Yes" : "No");
console.log("Supabase Key loaded:", supabaseAnonKey ? "Yes" : "No");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env file.");
}

// Synchronously wipe the invalid auth token before the client even initializes
try {
  localStorage.removeItem('sb-iyvbjmecoihcqfzyhkgq-auth-token');
} catch (e) {
  // Ignore
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Force clear any old, expired login tokens from browser storage
supabase.auth.signOut().then(() => {
  console.log("Supabase Auth local session cleared programmatically.");
}).catch(err => {
  console.error("Error clearing Supabase Auth session:", err);
});
