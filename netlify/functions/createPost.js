import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return { statusCode: 500, body: 'Server Configuration Error' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { category, content, foundData, location, author_id } = JSON.parse(event.body);

        // 1. Validation (Basic)
        if (!category || !location) {
            return { statusCode: 400, body: 'Missing required fields' };
        }

        // Enforce Found-Only Policy
        if (category === 'found' && content) {
            return { statusCode: 400, body: 'Found items cannot have free text content.' };
        }
        if (category !== 'found' && !content) {
            return { statusCode: 400, body: 'Content required for this category.' };
        }

        // 2. Fuzz Location (Simple Random Offset)
        // 0.001 deg is roughly 111 meters. 
        // Fuzzing by +/- 0.002 deg (~200m radius box)
        const fuzzFactor = 0.002;
        const fuzzedLat = location.lat + (Math.random() * fuzzFactor * 2 - fuzzFactor);
        const fuzzedLng = location.lng + (Math.random() * fuzzFactor * 2 - fuzzFactor);

        // 3. Insert into DB (Status Published for MVP)
        // PostGIS Point format: SRID 4326 (WGS 84)
        // Note: Supabase JS client handles geography types if passed as string "POINT(lng lat)"
        // or sometimes we need raw SQL. But simple insert usually works for simple columns.

        // Auth Check: We should verify the JWT from 'Authorization' header in a real app.
        // For MVP/Demo: we trust the 'author_id' sent from client (which comes from supabase.auth.user().id)
        // BUT this is insecure. 
        const token = event.headers.authorization?.split(' ')[1];
        let userId = null;
        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        const finalUserId = userId || author_id;

        // We can't use `location_geog: string` directly with `insert` sometimes if Supabase/PostgREST expects GeoJSON or WKT specifically cast.
        // However, `POINT(lng lat)` WKT string usually works if the column is geography.

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
                    location_geog: `POINT(${fuzzedLng} ${fuzzedLat})`,
                    status: 'published',
                    author_user_id: finalUserId
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
            body: JSON.stringify({ error: error.message }),
        };
    }
};
