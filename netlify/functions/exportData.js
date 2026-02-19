import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization header' }) };
        }

        const token = authHeader.replace('Bearer ', '');

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

        // 2. Fetch Data via Service Role (to get deleted posts too)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Fetch Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Fetch Posts (include soft deleted)
        const { data: posts, error: postsError } = await supabaseAdmin
            .from('posts')
            .select('*')
            .eq('author_user_id', user.id)
            .order('created_at', { ascending: false });

        if (profileError) console.error("Profile export error:", profileError);
        if (postsError) console.error("Posts export error:", postsError);

        const exportData = {
            user_id: user.id,
            email: user.email, // Include email from auth user object
            exported_at: new Date().toISOString(),
            profile: profile || null,
            posts: posts || []
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(exportData)
        };

    } catch (error) {
        console.error('Export Data Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
