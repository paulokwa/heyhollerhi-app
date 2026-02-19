import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization header' }) };
        }

        const token = authHeader.replace('Bearer ', '');
        const { postId } = JSON.parse(event.body);

        if (!postId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing postId' }) };
        }

        // Initialize Supabase
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
        }

        // 1. Verify User
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
        }

        // 2. Perform Soft Delete via Service Role (to ensure we can write to restricted cols)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Verify ownership first
        const { data: post, error: fetchError } = await supabaseAdmin
            .from('posts')
            .select('author_user_id')
            .eq('id', postId)
            .single();

        if (fetchError || !post) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Post not found' }) };
        }

        if (post.author_user_id !== user.id) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized: You do not own this post' }) };
        }

        // Update post to soft deleted
        const { error: updateError } = await supabaseAdmin
            .from('posts')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: user.id
            })
            .eq('id', postId);

        if (updateError) {
            throw updateError;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Post deleted successfully', id: postId })
        };

    } catch (error) {
        console.error('Delete Post Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
