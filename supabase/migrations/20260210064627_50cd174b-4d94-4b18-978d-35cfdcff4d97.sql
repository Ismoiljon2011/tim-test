
-- Fix: Allow super_admin to view all test results
DROP POLICY IF EXISTS "Admins can view all results" ON public.test_results;
CREATE POLICY "Admins can view all results" 
ON public.test_results 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
