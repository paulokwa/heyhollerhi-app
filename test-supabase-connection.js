
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

// Load .env
if (fs.existsSync('.env')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Testing Service Role Key

console.log('--- Testing Supabase Connection ---');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? supabaseKey.substring(0, 15) + '...' : 'UNDEFINED'}`);

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('--- 1. Raw Network Test ---');
    try {
        const start = Date.now();
        console.log(`Fetching ${supabaseUrl}...`);
        const res = await fetch(supabaseUrl);
        console.log(`[PASS] Raw fetch status: ${res.status} (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[FAIL] Raw fetch failed: ${e.message}`);
        console.error('This indicates a general Node.js networking issue (Firewall/VPN/Proxy).');
        return; // Exit if basic network fails
    }

    // console.log('\n--- 2. Supabase Client Test ---');
    // try {
    //     console.log('Attempting to fetch 1 post...');
    //     // Set a timeout to fail faster than default
    //     const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Manual Timeout: Connection took too long')), 5000));

    //     const fetchPromise = supabase
    //         .from('posts')
    //         .select('count', { count: 'exact', head: true });

    //     const { count, error } = await Promise.race([fetchPromise, timeoutPromise]);

    //     if (error) {
    //         console.error('CONNECTION FAILED:', error.message);
    //         console.error('Full Error:', error);
    //     } else {
    //         console.log('SUCCESS! Connected to Supabase.');
    //         console.log(`Total posts count: ${count}`);
    //     }
    // } catch (err) {
    //     console.error('CRITICAL ERROR:', err.message);
    // }

    console.log('\n--- 3. Manual Authenticated Fetch Test ---');
    try {
        const url = `${supabaseUrl}/rest/v1/posts?select=count&limit=1`;
        console.log(`Fetching ${url}...`);
        const res = await fetch(url, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (!res.ok) {
            const text = await res.text();
            console.log('Body:', text);
        } else {
            console.log('Manual auth fetch PASSED.');
        }
    } catch (e) {
        console.error('Manual fetch FAILED:', e.message);
    }
}

(async () => {
    await testConnection();
})();
