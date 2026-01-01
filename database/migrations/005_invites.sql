-- Migration: Invite Link System
-- Adds:
-- - invites table (stores invite codes)
-- - invite_uses table (tracks who used which invite)
-- - profiles.referred_by column (optional referral tracking)
-- - RLS: invites/invite_uses are PRIVATE (server-only access via service role)

-- ============================================================
-- 1) INVITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  inviter_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  max_uses int,
  uses int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS invites_code_idx ON public.invites(code);
CREATE INDEX IF NOT EXISTS invites_inviter_user_id_idx ON public.invites(inviter_user_id);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- RLS: Keep invites PRIVATE - no public selects
-- Server route handlers will use SERVICE ROLE KEY to bypass RLS
-- Users can only manage their own invites via server routes

-- Policy: Users can view their own invites (for displaying in account page)
DROP POLICY IF EXISTS "Users can view own invites" ON public.invites;
CREATE POLICY "Users can view own invites"
  ON public.invites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = inviter_user_id);

-- Policy: Users can insert their own invites
DROP POLICY IF EXISTS "Users can create own invites" ON public.invites;
CREATE POLICY "Users can create own invites"
  ON public.invites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = inviter_user_id);

-- Policy: Users can update their own invites (e.g., increment uses)
DROP POLICY IF EXISTS "Users can update own invites" ON public.invites;
CREATE POLICY "Users can update own invites"
  ON public.invites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = inviter_user_id)
  WITH CHECK (auth.uid() = inviter_user_id);

-- ============================================================
-- 2) INVITE_USES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invite_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.invites(id) ON DELETE CASCADE,
  used_by_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invite_id, used_by_user_id)
);

CREATE INDEX IF NOT EXISTS invite_uses_invite_id_idx ON public.invite_uses(invite_id);
CREATE INDEX IF NOT EXISTS invite_uses_used_by_user_id_idx ON public.invite_uses(used_by_user_id);

ALTER TABLE public.invite_uses ENABLE ROW LEVEL SECURITY;

-- RLS: Keep invite_uses PRIVATE - no public access
-- Only accessible via SERVICE ROLE KEY in server routes

-- Policy: Users can view invite_uses for their own invites (to see who used them)
DROP POLICY IF EXISTS "Users can view uses of own invites" ON public.invite_uses;
CREATE POLICY "Users can view uses of own invites"
  ON public.invite_uses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invites i
      WHERE i.id = invite_uses.invite_id
        AND i.inviter_user_id = auth.uid()
    )
  );

-- ============================================================
-- 3) ADD referred_by TO PROFILES (OPTIONAL)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- 4) FUNCTION: Validate invite code (used by resolve route)
-- Returns invite details if valid, null otherwise
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS TABLE (
  id uuid,
  code text,
  inviter_user_id uuid,
  uses int,
  max_uses int,
  expires_at timestamptz,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT inv.id, inv.code, inv.inviter_user_id, inv.uses, inv.max_uses, inv.expires_at
    INTO v_invite
  FROM public.invites inv
  WHERE inv.code = p_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::uuid, NULL::text, NULL::uuid, NULL::int, NULL::int, NULL::timestamptz, false;
    RETURN;
  END IF;

  -- Check if expired
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN QUERY SELECT 
      v_invite.id, v_invite.code, v_invite.inviter_user_id, 
      v_invite.uses, v_invite.max_uses, v_invite.expires_at, false;
    RETURN;
  END IF;

  -- Check if max uses reached
  IF v_invite.max_uses IS NOT NULL AND v_invite.uses >= v_invite.max_uses THEN
    RETURN QUERY SELECT 
      v_invite.id, v_invite.code, v_invite.inviter_user_id, 
      v_invite.uses, v_invite.max_uses, v_invite.expires_at, false;
    RETURN;
  END IF;

  -- Valid invite
  RETURN QUERY SELECT 
    v_invite.id, v_invite.code, v_invite.inviter_user_id, 
    v_invite.uses, v_invite.max_uses, v_invite.expires_at, true;
END;
$$;

-- ============================================================
-- 5) FUNCTION: Consume invite (used after successful signup)
-- Increments uses count and records in invite_uses
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_invite(p_code text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id uuid;
  v_inviter_id uuid;
BEGIN
  -- Get and validate the invite
  SELECT id, inviter_user_id INTO v_invite_id, v_inviter_id
  FROM public.invites
  WHERE code = p_code
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses < max_uses);

  IF v_invite_id IS NULL THEN
    RETURN false;
  END IF;

  -- Don't allow self-invite
  IF v_inviter_id = p_user_id THEN
    RETURN false;
  END IF;

  -- Check if already used by this user
  IF EXISTS (
    SELECT 1 FROM public.invite_uses
    WHERE invite_id = v_invite_id AND used_by_user_id = p_user_id
  ) THEN
    RETURN true; -- Already consumed, idempotent success
  END IF;

  -- Record the usage
  INSERT INTO public.invite_uses (invite_id, used_by_user_id)
  VALUES (v_invite_id, p_user_id)
  ON CONFLICT (invite_id, used_by_user_id) DO NOTHING;

  -- Increment uses count
  UPDATE public.invites
  SET uses = uses + 1
  WHERE id = v_invite_id;

  -- Update the user's referred_by field
  UPDATE public.profiles
  SET referred_by = v_inviter_id
  WHERE id = p_user_id AND referred_by IS NULL;

  RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users for these functions
REVOKE ALL ON FUNCTION public.validate_invite_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO service_role;

REVOKE ALL ON FUNCTION public.consume_invite(text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_invite(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_invite(text, uuid) TO service_role;
