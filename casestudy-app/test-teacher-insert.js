import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iovbquiconpptsipcfel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdmJxdWljb25wcHRzaXBjZmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjM2NzYsImV4cCI6MjA4OTI5OTY3Nn0.QdpXxQwSFuypRT8Sm7yA6_6neutC_iI1jh4mnyFUY9g';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTeacherInsert() {
  const email = `testteacher_${Date.now()}@example.com`;
  const password = 'Password!123';
  
  console.log("Signing up:", email);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Test Teacher' } }
  });

  if (authError) {
    console.error("Sign up error:", authError);
    return;
  }
  
  console.log("Signed up:", authData.user.id);
  
  // Update profile to teacher
  const { error: profileError } = await supabase.from('profiles').insert([
    { id: authData.user.id, role: 'teacher', full_name: 'Test Teacher' }
  ]);
  
  if (profileError) {
     console.error("Profile error:", profileError);
  } else {
     console.log("Profile updated to teacher");
  }

  // Attempt to insert a case
  const newCase = {
      title: "Test Publish Case",
      content: "This is a test case to see if publish works",
      description: "Test description...",
      status: "active",
      attachments: [],
      update_history: [],
      teacher_id: authData.user.id
  };
  
  console.log("Inserting case...", newCase);
  const { data: caseData, error: caseError } = await supabase.from('cases').insert([newCase]);
  
  if (caseError) {
      console.error("Case insert error:", caseError);
  } else {
      console.log("Case inserted successfully:", caseData);
  }
}

testTeacherInsert();
