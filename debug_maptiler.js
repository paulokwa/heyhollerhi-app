import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
    const envPath = path.resolve(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const match = envConfig.match(/VITE_MAPTILER_KEY=(.*)/);
    const key = match ? match[1].trim() : null;

    if (!key) {
        console.error("No API KEY found in .env");
        process.exit(1);
    }

    const query = "Halifax Canada";
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${key}`;
    console.log("Fetching:", url);

    // Node 18+ has global fetch
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                const first = data.features[0];
                console.log("Feature Structure:");
                console.log(JSON.stringify(first, null, 2));

                console.log("\nHas geometry:", !!first.geometry);
                if (first.geometry) {
                    console.log("Geometry type:", first.geometry.type);
                    console.log("Coordinates:", first.geometry.coordinates);
                }
                console.log("Has center:", !!first.center);
                console.log("Center:", first.center);
            } else {
                console.log("No results");
            }
        })
        .catch(err => console.error(err));

} catch (e) {
    console.error("Error reading .env", e);
}
