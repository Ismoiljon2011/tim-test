
-- Fix the tests policy to also allow super_admins to manage tests
DROP POLICY IF EXISTS "Admins can manage tests" ON public.tests;
CREATE POLICY "Admins can manage tests" ON public.tests
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);
