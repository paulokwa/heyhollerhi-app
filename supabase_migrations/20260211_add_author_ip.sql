-- Add IP tracking column to posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS author_ip inet;

-- Index for faster rate limit lookups
CREATE INDEX IF NOT EXISTS idx_posts_author_ip ON public.posts(author_ip);
