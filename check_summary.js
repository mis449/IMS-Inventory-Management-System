import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyvbjmecoihcqfzyhkgq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dmJqbWVjb2loY3Fmenloa2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDc4NjcsImV4cCI6MjA5MjkyMzg2N30.ikA5BC3m1bpQsMN3hRS61ONnlxU7zAIKhZiZqlxdjWE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Checking inventory_summary columns...");
  const { data, error } = await supabase.from('inventory_summary').select('*').limit(1);
  console.log("Select Error:", error);
  console.log("Select Data:", data);
}
test();
