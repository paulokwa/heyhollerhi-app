
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

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

if (!supabaseKey.startsWith('ey')) {
    console.warn('WARNING: The key does NOT start with "ey". This is likely an invalid key format for Supabase (which uses JWTs).');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Attempting to fetch 1 post...');
        // Set a timeout to fail faster than default
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Manual Timeout: Connection took too long')), 5000));

        const fetchPromise = supabase
            .from('posts')
            .select('count', { count: 'exact', head: true });

        const { count, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) {
            console.error('CONNECTION FAILED:', error.message);
            console.error('Full Error:', error);
        } else {
            console.log('SUCCESS! Connected to Supabase.');
            console.log(`Total posts count: ${count}`);
        }
    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
    }
}

testConnection();
