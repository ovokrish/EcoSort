# Chat Functionality Setup

This document provides instructions for setting up the chat functionality in the EcoSort application.

## Prerequisites

- Access to your Supabase project dashboard
- Node.js installed (for running the setup script)

## Setting Up the Messages Table

There are two ways to set up the messages table:

### Option 1: Using the Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL:

```sql
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
```

4. Click "Run" to execute the SQL

### Option 2: Using the Setup Script

1. Install the required dependencies:
   ```
   npm install dotenv @supabase/supabase-js
   ```

2. Run the setup script:
   ```
   node src/scripts/setupMessagesTable.js
   ```

3. Follow the instructions provided by the script

## Verifying the Setup

After setting up the messages table, you can verify that it's working correctly by:

1. Opening the EcoSort application
2. Navigating to the Community Chat page
3. Trying to send a message

If everything is set up correctly, you should be able to send and receive messages without any errors.

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that the messages table exists in your Supabase database
3. Ensure that the Row Level Security policies are correctly set up
4. Check that your Supabase URL and API key are correctly configured in the application

## Need Help?

If you need further assistance, please contact the development team or refer to the Supabase documentation. 