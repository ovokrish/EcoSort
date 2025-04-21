// This script sets up the messages table in Supabase
// Run this script using Node.js: node setupMessagesTable.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupMessagesTable() {
  try {
    console.log('Setting up messages table...');
    
    // SQL to create the messages table
    const sql = `
      -- Create messages table
      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        message TEXT NOT NULL,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        user_name TEXT NOT NULL,
        is_waste_related BOOLEAN DEFAULT false NOT NULL
      );

      -- Enable Row Level Security
      ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Allow users to read messages"
      ON public.messages
      FOR SELECT
      TO authenticated
      USING (true);

      CREATE POLICY "Allow authenticated users to create messages"
      ON public.messages
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);
      CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages(user_id);
      CREATE INDEX IF NOT EXISTS messages_is_waste_related_idx ON public.messages(is_waste_related);

      -- Grant necessary permissions
      GRANT ALL ON public.messages TO authenticated;
      GRANT ALL ON public.messages TO service_role;
    `;

    // Execute the SQL using the Supabase dashboard SQL editor
    console.log(`
    ===================================================
    Please run the following SQL in your Supabase dashboard:
    
    ${sql}
    
    ===================================================
    `);
    
    console.log('Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute the SQL');
    console.log('5. After running the SQL, the messages table will be created');
    
    // Check if the table exists after setup
    const { error } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('\nTable does not exist yet. Please run the SQL in the Supabase dashboard.');
    } else {
      console.log('\nTable exists! Setup complete.');
    }
    
  } catch (error) {
    console.error('Error setting up messages table:', error);
  }
}

setupMessagesTable(); 