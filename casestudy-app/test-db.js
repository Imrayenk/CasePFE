import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iovbquiconpptsipcfel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdmJxdWljb25wcHRzaXBjZmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjM2NzYsImV4cCI6MjA4OTI5OTY3Nn0.QdpXxQwSFuypRT8Sm7yA6_6neutC_iI1jh4mnyFUY9g';
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
