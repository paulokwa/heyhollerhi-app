import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return { statusCode: 500, body: 'Server Configuration Error' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { category, content, foundData, location, author_id } = JSON.parse(event.body);

        // 0. Extract & Normalize IP
        // Netlify / AWS Lambda headers
        const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '0.0.0.0';

        // 1. Validation (Basic)
        if (!category || !location) {
            return { statusCode: 400, body: 'Missing required fields' };
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

        // --- RATE LIMITING START ---

        // Configuration
        const LIMITS = {
            positive: { cooldownMin: 5, dailyCap: 10, sharedCapGroup: 'pos_gen' },
            general: { cooldownMin: 5, dailyCap: 10, sharedCapGroup: 'pos_gen' },
            rant: { cooldownMin: 30, dailyCap: 3 },
            found: { cooldownMin: 15, dailyCap: 5 }
        };
        const config = LIMITS[category] || LIMITS.general;

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // A. Check Cooldown (Last post by IP in this category)
        const cooldownTime = new Date(now.getTime() - config.cooldownMin * 60 * 1000);

        const { data: lastPost, error: lastPostError } = await supabase
            .from('posts')
            .select('created_at')
            .eq('author_ip', clientIp)
            .eq('category', category)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (lastPost && !lastPostError) {
            const lastPostTime = new Date(lastPost.created_at);
            if (lastPostTime > cooldownTime) {
                const nextAvailable = new Date(lastPostTime.getTime() + config.cooldownMin * 60 * 1000);
                const waitSeconds = Math.ceil((nextAvailable - now) / 1000);
                return {
                    statusCode: 429,
                    body: JSON.stringify({
                        error: `Cooling down! Wait ${Math.ceil(waitSeconds / 60)}m.`,
                        retryAfter: waitSeconds,
                        nextAvailable: nextAvailable.toISOString()
                    })
                };
            }
        }

        // B. Check Daily Cap
        // If shared group (Positive+General), count both
        let capQuery = supabase
            .from('posts')
            .select('id', { count: 'exact' })
            .eq('author_ip', clientIp)
            .gte('created_at', oneDayAgo.toISOString());

        if (config.sharedCapGroup === 'pos_gen') {
            capQuery = capQuery.in('category', ['positive', 'general']);
        } else {
            capQuery = capQuery.eq('category', category);
        }

        const { count, error: capError } = await capQuery;

        if (count >= config.dailyCap) {
            return {
                statusCode: 429,
                body: JSON.stringify({ error: `Daily limit reached for ${category} posts.` })
            };
        }

        // --- RATE LIMITING END ---


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
                    author_user_id: finalUserId,
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
            body: JSON.stringify({ error: error.message }),
        };
    }
};
