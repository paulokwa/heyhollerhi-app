
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.resolve(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const match = envConfig.match(/VITE_MAPTILER_KEY=(.*)/);
const key = match ? match[1].trim() : null;

if (!key) {
    console.error("No API KEY found");
    process.exit(1);
}

const queries = [
    "Halifax, Nova Scotia, Canada",
    "Halifax, NS",
    "Halifax"
];

async function run() {
    for (const q of queries) {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${key}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                const f = data.features[0];
                console.log(`Query: "${q}"`);
                console.log(`  Name: ${f.place_name}`);
                console.log(`  Coords: ${f.geometry.coordinates}`);
                console.log(`  Type: ${f.place_type}`);
                console.log("------------------------------------------------");
            } else {
                console.log(`Query: "${q}" - NO RESULTS`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

run();
