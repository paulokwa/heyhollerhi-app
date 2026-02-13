
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env manually to ensure we see exactly what's on disk
const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
const envConfig = dotenv.parse(envContent);

const VARS_TO_CHECK = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_URL',
    'SUPABASE_SECRET_KEY'
];

console.log('--- Environment Variable Check ---');

VARS_TO_CHECK.forEach(key => {
    const value = envConfig[key];

    if (!value) {
        console.log(`[MISSING] ${key}`);
        return;
    }

    console.log(`[LOADED]  ${key}`);

    // Check for quotes or whitespace
    if (value.startsWith('"') || value.startsWith("'")) {
        console.error(`  ERROR: Value starts with a quote character. Remove quotes from .env.`);
    }
    if (value.endsWith('"') || value.endsWith("'")) {
        console.error(`  ERROR: Value ends with a quote character. Remove quotes from .env.`);
    }
    if (value.trim() !== value) {
        console.error(`  ERROR: Value contains leading/trailing whitespace.`);
    }

    console.log(`  Length: ${value.length}`);
    console.log(`  Prefix: ${value.substring(0, 5)}...`);
    console.log(`  Suffix: ...${value.substring(value.length - 5)}`);
});
