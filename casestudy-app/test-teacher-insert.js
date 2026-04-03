import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
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
