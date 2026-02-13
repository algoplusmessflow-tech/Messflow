-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the receipts bucket
-- Allow public read access to receipts
CREATE POLICY "Give public access to receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');

-- Allow authenticated users to upload receipts
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- Allow users to update their own receipts
CREATE POLICY "Allow users to update own receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'receipts' AND owner = auth.uid());

-- Allow users to delete their own receipts
CREATE POLICY "Allow users to delete own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipts' AND owner = auth.uid());
