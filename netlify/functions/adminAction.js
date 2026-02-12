import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
    // CORS headers for local dev if needed, typically netlify handles this.
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { action, target_id } = JSON.parse(event.body || '{}');
    const adminSecret = event.headers['x-admin-secret'];

    // 1. Verify Secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    // 2. Init Supabase (Service Role)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        let result;

        if (action === 'list_posts') {
            // Fetch validation queue or all posts
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            result = data;
        }
        else if (action === 'delete_post') {
            const { data, error } = await supabase
                .from('posts')
                .update({ status: 'removed' })
                .eq('id', target_id)
                .select();

            if (error) throw error;
            result = data;
        }
        else if (action === 'ban_user') {
            // Ban the user by adding to penalties table
            // We need a user_id. We'll ban the AUTHOR of the target post if target_id is passed as userId?
            // Actually implementation plan said target_id is user_id for ban_user.

            // NOTE: Ideally we check if they are already banned.
            const { data, error } = await supabase
                .from('user_penalties')
                .insert([{
                    user_id: target_id,
                    penalty_type: 'ban',
                    reason: 'Admin Action'
                }])
                .select();

            if (error) throw error;
            result = data;
        }
        else {
            return { statusCode: 400, body: 'Unknown Action' };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (e) {
        console.error("Admin Action Error:", e);
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
