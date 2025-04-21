import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../supabase/migrations/20240324_create_messages.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error setting up database:', error);
      return;
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the setup
setupDatabase(); 