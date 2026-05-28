import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyvbjmecoihcqfzyhkgq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dmJqbWVjb2loY3Fmenloa2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDc4NjcsImV4cCI6MjA5MjkyMzg2N30.ikA5BC3m1bpQsMN3hRS61ONnlxU7zAIKhZiZqlxdjWE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Checking columns...");
  const { data, error } = await supabase.from('inventory_transactions').select('*').limit(1);
  console.log("Select Error:", error);
  console.log("Select Data:", data);

  if (data && data.length > 0) {
    console.log("Trying an update on first record...");
    const { error: updateError } = await supabase
      .from('inventory_transactions')
      .update({ actual_date: new Date().toISOString().split('T')[0] })
      .eq('id', data[0].id);
    console.log("Update Error:", updateError);
  }
}
test();
