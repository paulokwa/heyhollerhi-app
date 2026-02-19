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

        // 2a. Anonymize Posts (Option 1: Keep posts for community)
        console.log('Anonymizing posts for:', user.id);
        const { error: postsError } = await supabaseAdmin
            .from('posts')
            .update({
                author_alias: 'Deleted User',
                author_user_id: null, // Remove link to user
                avatar_seed: 'deleted'
            })
            .eq('author_user_id', user.id);

        if (postsError) {
            console.error('Error anonymizing posts:', postsError);
        }

        // 2b. Anonymize Profile
        console.log('Anonymizing profile for:', user.id);
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                display_name: 'Deleted User',
                bio: null,
                avatar_seed: 'deleted',
                status: 'deleted',
                deleted_at: new Date().toISOString(),
                anonymized_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (profileError) {
            console.error('Error anonymizing profile:', profileError);
        }

        // 3. Soft Delete Auth User (Release Email & Ban)
        // We change email to allow re-signup with the same address.
        const deletedEmail = `deleted_${user.id}@deleted.com`;

        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            {
                email: deletedEmail,
                phone: null,
                user_metadata: { status: 'deleted' },
                app_metadata: { status: 'deleted' },
                ban_duration: '876000h' // 100 years
            }
        );

        if (updateAuthError) {
            console.error('Auth update error:', updateAuthError);
            // If we fail to update email/ban, we might fallback to delete if strict requirement,
            // but for now let's return error but consider it partial success if profiles updated.
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fully anonymize account: ' + updateAuthError.message }) };
        }

        // We do NOT delete the user from auth, to preserve the ID for the profile record (since FK exists).
        // But we banned them and changed email.

        console.log('User anonymized successfully:', user.id);

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
