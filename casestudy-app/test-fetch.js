import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
  const { data, error } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
  console.log("Fetch Error:", error);
  console.log("Data length:", data ? data.length : 0);
  
  if (data) {
     try {
         const mappedCases = data.map(c => ({
             id: c.id,
             title: c.title,
             content: c.content,
             description: c.description || '',
             date: new Date(c.created_at).toISOString().split('T')[0],
             status: c.status === 'draft' ? 'Draft' : (c.status === 'active' ? 'Active' : 'Closed'),
             attachments: c.attachments || [],
             updateHistory: c.update_history || []
         }));
         console.log("Mapped successfully! First case:", mappedCases[0]);
     } catch(e) {
         console.error("Mapping threw an error:", e);
     }
  }
}

testFetch();
