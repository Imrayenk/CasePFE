import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  // We don't have auth, so this might fail with RLS, but let's see what error it throws exactly.
  // Wait, if we login with fake credentials, it fails.
  // Let's just try to insert and log the exact error.
  const newCase = {
      title: "Test Insert",
      content: "This is a test case",
      description: "Test description...",
      status: "active",
      attachments: [],
      update_history: [],
      teacher_id: null
  };
  
  const { data, error } = await supabase.from('cases').insert([newCase]);
  console.log("Insert result:", { data, error });
}

testInsert();
