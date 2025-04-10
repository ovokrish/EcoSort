
-- Create messages table for community chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policy: anyone can read messages
CREATE POLICY "Anyone can read messages"
  ON public.chat_messages
  FOR SELECT
  USING (true);

-- RLS policy: users can insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policy: users can update their own messages
CREATE POLICY "Users can update their own messages"
  ON public.chat_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policy: users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update messages table to trigger updated_at
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- If the function doesn't exist yet:
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
