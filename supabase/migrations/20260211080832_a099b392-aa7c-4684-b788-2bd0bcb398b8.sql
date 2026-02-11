
-- Add test_type column to tests table (olympiad = one attempt, practice = multiple attempts)
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS test_type text NOT NULL DEFAULT 'practice';

-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add index for test_type
CREATE INDEX IF NOT EXISTS idx_tests_test_type ON public.tests (test_type);

-- Allow admins to delete tests (cascade to questions and results)
-- First add ON DELETE CASCADE to questions
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_test_id_fkey;
ALTER TABLE public.questions ADD CONSTRAINT questions_test_id_fkey 
  FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;

-- Add cascade to test_results
ALTER TABLE public.test_results DROP CONSTRAINT IF EXISTS test_results_test_id_fkey;
ALTER TABLE public.test_results ADD CONSTRAINT test_results_test_id_fkey 
  FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;

-- Add cascade to test_assignments
ALTER TABLE public.test_assignments DROP CONSTRAINT IF EXISTS test_assignments_test_id_fkey;
ALTER TABLE public.test_assignments ADD CONSTRAINT test_assignments_test_id_fkey 
  FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;

-- Fix storage policy for question-images to allow authenticated users to upload
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
  
  -- Allow authenticated users to upload to question-images bucket
  CREATE POLICY "Allow authenticated uploads"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'question-images');

  -- Allow public read access
  CREATE POLICY "Allow public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'question-images');
  
  -- Allow authenticated users to update their uploads
  CREATE POLICY "Allow authenticated updates"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'question-images');
  
  -- Allow authenticated users to delete their uploads
  CREATE POLICY "Allow authenticated deletes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'question-images');
END
$$;
