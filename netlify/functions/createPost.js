import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return { statusCode: 500, body: 'Server Configuration Error' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log("CreatePost Invoked. Body length:", event.body.length);
        const { category, content, foundData, location, author_id, author_alias, avatar_seed } = JSON.parse(event.body);

        console.log("Parsed Payload Location:", location);

        // 0. Extract & Normalize IP
        const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '0.0.0.0';

        // 1. Validation (Basic)
        if (!category || !location) {
            console.error("Missing required fields");
            return { statusCode: 400, body: 'Missing required fields' };
        }

        // Validate Coordinates
        if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            console.error("Invalid coordinates types:", typeof location.lat, typeof location.lng);
            return { statusCode: 400, body: 'Invalid coordinates' };
        }

        // Safety: Profanity Filter (Basic MVP)
        const badWords = ['badword1', 'badword2']; // TODO: Expand or use library
        if (content && badWords.some(w => content.toLowerCase().includes(w))) {
            return { statusCode: 400, body: 'Content contains inappropriate language.' };
        }

        // Safety: Length Limit
        if (content && content.length > 280) {
            return { statusCode: 400, body: 'Content exceeds 280 characters.' };
        }

        // Enforce Found-Only Policy
        if (category === 'found' && content) {
            return { statusCode: 400, body: 'Found items cannot have free text content.' };
        }
        if (category !== 'found' && !content) {
            return { statusCode: 400, body: 'Content required for this category.' };
        }

        // 2. Exact Location (No Fuzzing)
        let lat = Number(location.lat);
        let lng = Number(location.lng);

        if (isNaN(lat) || isNaN(lng)) {
            console.error("NaN Coordinates detected:", location);
            return { statusCode: 400, body: 'Invalid coordinates' };
        }

        // Use exact coordinates
        const fuzzedLng = lng;
        const fuzzedLat = lat;

        // Ensure proper formatting for WKT
        const wkt = `POINT(${fuzzedLng.toFixed(6)} ${fuzzedLat.toFixed(6)})`;
        console.log("Generated WKT:", wkt);

        // 3. User ID Extraction
        // Auth Check: We should verify the JWT from 'Authorization' header in a real app.
        // For MVP/Demo: we trust the 'author_id' sent from client (which comes from supabase.auth.user().id)
        const token = event.headers.authorization?.split(' ')[1];
        let userId = null;
        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        const finalUserId = userId || author_id;

        // 4. Insert into DB
        const { data, error } = await supabase
            .from('posts')
            .insert([
                {
                    category,
                    text_content: content,
                    found_item_type: foundData?.itemType,
                    found_item_class: foundData?.itemClass,
                    found_datetime: foundData?.date,
                    found_disposition: foundData?.disposition,
                    found_business_type: foundData?.businessType,
                    location_geog: wkt,
                    location_label: location.label,
                    location_precision_m: 200,
                    status: 'published',
                    author_user_id: finalUserId,
                    author_alias: author_alias || 'Anonymous', // Snapshot alias
                    avatar_seed: avatar_seed, // Snapshot avatar
                    author_ip: clientIp // Track IP
                }
            ])
            .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Error creating post:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                details: error.toString(),
                stack: error.stack
            }),
        };
    }
};
