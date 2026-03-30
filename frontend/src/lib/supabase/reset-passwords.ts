import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zsduvdvpiocrdxqqodwh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZHV2ZHZwaW9jcmR4cXFvZHdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg0MTk2MSwiZXhwIjoyMDg5NDE3OTYxfQ.LbmSbVGNlKojYA7uURhWmHgSdQJD2j18wMnAhCYLgXk';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TARGET_EMAILS = ['user@example.com', 'admin@example.com'];
const NEW_PASSWORD = 'password123';

async function resetPasswords() {
  console.log('--- Resetting Passwords ---');
  
  for (const email of TARGET_EMAILS) {
    console.log(`Searching for user: ${email}...`);
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.find(u => u.email === email);
    
    if (user) {
      console.log(`Found user ${email} (ID: ${user.id}). Resetting password...`);
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: NEW_PASSWORD }
      );
      
      if (resetError) {
        console.error(`Failed to reset password for ${email}:`, resetError.message);
      } else {
        console.log(`Successfully reset password for ${email} to "${NEW_PASSWORD}"`);
      }
    } else {
      console.warn(`User ${email} not found in Supabase Auth.`);
    }
  }
}

resetPasswords();
