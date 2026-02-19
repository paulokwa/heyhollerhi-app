-- RPC to check if email exists (for checking "Account not found" state)
-- SECURITY DEFINER allows it to access auth.users which is normally restricted.
-- REVOKE EXECUTE from PUBLIC/anon if you want to restrict this to service_role only.

CREATE OR REPLACE FUNCTION public.email_exists(email_addr text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth -- Secure search path
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE email = email_addr);
END;
$$;
