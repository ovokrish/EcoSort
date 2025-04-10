
-- Create storage bucket for waste scans
INSERT INTO storage.buckets (id, name, public)
VALUES ('waste-scans', 'Waste Scan Images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for waste-scans bucket
CREATE POLICY "Public read access for waste scan images"
ON storage.objects FOR SELECT
USING (bucket_id = 'waste-scans');

CREATE POLICY "Users can upload their own waste scan images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'waste-scans' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
