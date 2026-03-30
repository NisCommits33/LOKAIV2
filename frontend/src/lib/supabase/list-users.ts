import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zsduvdvpiocrdxqqodwh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZHV2ZHZwaW9jcmR4cXFvZHdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg0MTk2MSwiZXhwIjoyMDg5NDE3OTYxfQ.LbmSbVGNlKojYA7uURhWmHgSdQJD2j18wMnAhCYLgXk';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  console.log('--- Current Users ---');
  users.forEach(u => {
    console.log(`Email: ${u.email}, ID: ${u.id}`);
  });
}

run();
