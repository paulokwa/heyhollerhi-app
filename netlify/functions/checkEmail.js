import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { email } = JSON.parse(event.body);

        if (!email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing email' }) };
        }

        // Initialize Supabase Admin
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing env vars');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Check if user exists using our secure RPC function
        // Requires: create or replace function email_exists(email_addr text) returns boolean...
        const { data, error } = await supabaseAdmin.rpc('email_exists', { email_addr: email });

        if (error) {
            console.error("RPC Error", error);
            // Fallback: If RPC fails (e.g. migration not run), return error text so frontend knows
            return { statusCode: 200, headers, body: JSON.stringify({ exists: false, error: 'verification_failed' }) };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ exists: data })
        };

    } catch (error) {
        console.error('Check Email Exception:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
