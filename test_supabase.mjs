import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyvbjmecoihcqfzyhkgq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dmJqbWVjb2loY3Fmenloa2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDc4NjcsImV4cCI6MjA5MjkyMzg2N30.ikA5BC3m1bpQsMN3hRS61ONnlxU7zAIKhZiZqlxdjWE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const insertData = {
    id: "TEST-NODE-" + Date.now(),
    quotation_no: "QUOT-NODE-TEST",
    customer_name: "Node Test",
    date: new Date().toISOString().split('T')[0],
    status: 'Active',
    supply_status: '-',
    details: {}
  };

  const { data, error } = await supabase.from('quotation').insert([insertData]).select();
  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert success:", data);
  }
}

testInsert();
