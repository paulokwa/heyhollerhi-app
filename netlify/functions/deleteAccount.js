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
            console.error('Missing authorization header');
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization header' }) };
        }

        const token = authHeader.replace('Bearer ', '');

        // 1. Verify User
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing Supabase URL or Anon Key', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error: Missing public keys' }) };
        }

        // Client for verification
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            console.error('User verification failed:', userError);
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token: ' + (userError?.message || 'No user found') }) };
        }

        console.log('User authenticated:', user.id);

        // 2. Delete User using Service Role
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error: Missing service role key' }) };
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 2a. Manually delete related data (Cascade workaround)
        console.log('Cleaning up user data for:', user.id);

        // Delete Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', user.id);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            // We continue even if profile delete fails, as it might not exist or might be the cause of the next error
        }

        // Delete Posts
        const { error: postsError } = await supabaseAdmin
            .from('posts')
            .delete()
            .eq('author_user_id', user.id);

        if (postsError) {
            console.error('Error deleting posts:', postsError);
        }

        // 3. Delete User from Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete user: ' + deleteError.message }) };
        }

        console.log('User deleted successfully:', user.id);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Account deleted successfully' })
        };

    } catch (error) {
        console.error('Handler error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error: ' + error.message }) };
    }
};
