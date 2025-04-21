# Setting Up the Messages Table in Supabase

This document provides simple instructions for setting up the messages table in your Supabase database.

## Step 1: Go to Supabase Dashboard

1. Log in to your Supabase account
2. Select your project

## Step 2: Open SQL Editor

1. In the left sidebar, click on "SQL Editor"
2. Click "New Query"

## Step 3: Create the Messages Table

1. Copy and paste the following SQL into the editor:

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

2. Click "Run" to execute the SQL

## Step 4: Verify the Table was Created

1. In the left sidebar, click on "Table Editor"
2. You should see a "messages" table in the list
3. Click on it to verify the structure

That's it! The messages table is now set up and ready to use with the chat functionality in your application. 