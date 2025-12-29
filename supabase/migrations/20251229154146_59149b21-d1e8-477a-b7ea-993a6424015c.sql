-- Add explicit RESTRICTIVE policy to deny anonymous access to profiles table
-- This provides defense-in-depth against accidentally exposing data

CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Also add restrictive policies to the leads table (mentioned in security findings)
CREATE POLICY "Deny anonymous access to leads" 
ON public.leads 
AS RESTRICTIVE
FOR ALL 
USING (auth.uid() IS NOT NULL);