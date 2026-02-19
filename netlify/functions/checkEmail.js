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
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Check if user exists by listing users with this email (admin only)
        // listUsers is not ideal for checking one email, but getUserByEmail logic might differ by library version.
        // Actually, listUsers({ query: email }) is often fuzzy.

        // Better way: Admin *can* assume identities. Or just try to get user by email?
        // supabase-js v2 admin has listUsers.

        // Let's use listUsers filtering?
        // Or simpler: The only way to know for sure without auth is this.

        // Warning: This creates user enumeration vulnerability.

        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        // This fetches page 1. If we have many users this is bad.
        // We really want `getUserById` but we don't have ID.

        // Alternative: Try to generate a link? No.

        // Actually, Supabase Admin API doesn't have a direct "getUserByEmail" exposed easily in JS client usually unless updated.
        // Let's check docs logic... 

        // Workaround: We can't easily check simply without scanning or using a specific RPC if we don't want to list all.
        // WAIT: We can use `supabaseAdmin.from('auth.users').select('id').eq('email', email)`? 
        // No, `auth` schema is not exposed to PostgREST usually unless we granted access to service role?
        // Service Role *bypasses* RLS, so it CAN access `auth.users` IF the API exposes it. 
        // Often `auth` schema is not exposed on the API url.

        // Correct approach with Supabase Admin:
        // Use `listUsers` with `email` filter? Not available in some versions.

        // Let's try to be smart:
        // If we can't efficiently check "exists", maybe we can rely on the error code from the client?
        // No, client returns 400 for both.

        // Let's use a widely accepted workaround:
        // Using `admin.createUser` with the email? It will fail if exists.
        // But that sends a confirmation email if success!

        // Ideally we should not do this.
        // But the user persists.

        // Let's try: `supabaseAdmin.rpc('check_if_email_exists', { email_input: email })`
        // I'd need to add that RPC.

        // Let's create an RPC in a migration first? Or just use SQL.
        // Does the user want me to modify DB again?

        // Let's look for a simpler way.
        // `supabase.auth.signInWithOtp`? 

        // Let's stick to the "User Enumeration" risk is acceptable here.
        // How to check specific email in admin?
        // `await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 })` doesn't filter by email.

        // Ah, `supabaseAdmin.rpc` is best if I can add a function.
        // I created `gdpr_soft_delete.sql` earlier. I can add another function there?
        // "create or replace function check_email_exists(email_input text) returns boolean..."
        // SECURITY DEFINER to allow checking `auth.users`.

        // I'll update `supabase_migrations/gdpr_soft_delete.sql` (or create a new one) to add this function?
        // The user hasn't run the migration yet (hopefully).
        // Or I can add a new migration `supabase_migrations/check_email_rpc.sql`.

        // Let's do that. It's cleaner.

        // Function:
        /*
        CREATE OR REPLACE FUNCTION public.email_exists(email_addr text)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN EXISTS (SELECT 1 FROM auth.users WHERE email = email_addr);
        END;
        $$;
        */

        // Then `checkEmail.js` calls this RPC.

        // Wait, I can try to avoid SQL if possible.
        // Is there really no admin method?
        // `supabaseAdmin.auth.admin.listUsers()` is only way without SQL.

        // I will Create the RPC. It's robust.

        // But to make the JS function work without the RPC (if user forgets migration):
        // I'll return "unknown" and let frontend handle it?

        // No, I'll provide the SQL and tell user to run it.

        const { data, error } = await supabaseAdmin.rpc('email_exists', { email_addr: email });

        if (error) {
            console.error("RPC Error", error);
            // Fallback: If RPC fails (not exists), we return false or error?
            // Maybe return a specific code so frontend knows "Can't verify".
            return { statusCode: 200, headers, body: JSON.stringify({ exists: false, error: 'verification_failed' }) };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ exists: data })
        };

    } catch (error) {
        console.error('Check Email Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
