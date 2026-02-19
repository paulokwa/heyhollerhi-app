-- Migration: GDPR and Soft Deletion Support

-- 1. PROFILES TABLE UPDATES
-- Add status and timestamps
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'banned')),
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

-- 2. POSTS TABLE UPDATES
-- Add soft delete flags
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- Ensure status column exists (it should, but just in case)
-- ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';

-- 3. UPDATE RLS POLICIES FOR POSTS

-- Drop old policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;

-- New Policy 1: Public can view ONLY active, published posts
CREATE POLICY "Public can view active posts"
ON public.posts FOR SELECT
USING (status = 'published' AND is_deleted = false);

-- New Policy 2: Authors can view their OWN posts (including deleted ones)
CREATE POLICY "Authors can view own posts"
ON public.posts FOR SELECT
USING (auth.uid() = author_user_id);

-- 4. UPDATE RLS FOR PROFILES (Optional hardening)
-- Ensure only active users can update their profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own active profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id AND status = 'active')
WITH CHECK (auth.uid() = id AND status = 'active');

-- 5. INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON public.posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
