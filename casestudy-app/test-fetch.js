import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iovbquiconpptsipcfel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdmJxdWljb25wcHRzaXBjZmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjM2NzYsImV4cCI6MjA4OTI5OTY3Nn0.QdpXxQwSFuypRT8Sm7yA6_6neutC_iI1jh4mnyFUY9g';
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
        } catch (e) {
            console.error("Mapping threw an error:", e);
        }
    }
}

testFetch();
