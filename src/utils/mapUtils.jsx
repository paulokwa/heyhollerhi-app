export const getCategoryColor = (category) => {
    switch (category) {
        case 'positive': return '#10b981';
        case 'rant': return '#f43f5e';
        case 'general': return '#3b82f6';
        case 'found': return '#eab308';
        default: return '#94a3b8';
    }
};

export const getMarkerImage = (category) => {
    // Colors
    const colors = {
        positive: '#10b981',
        rant: '#f43f5e',
        general: '#3b82f6',
        found: '#eab308',
        default: '#94a3b8'
    };
    const color = colors[category] || colors.default;

    // SVG templates for icons (simplified paths)
    // Heart
    const heart = `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`;
    // Alert Triangle
    const alert = `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />`;
    // Message Circle
    const msg = `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />`;
    // Check (Found)
    const check = `<polyline points="20 6 9 17 4 12" />`;
    // Pin (Default)
    const pin = `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />`;

    let iconPath = pin;
    if (category === 'positive') iconPath = heart;
    if (category === 'rant') iconPath = alert;
    if (category === 'general') iconPath = msg;
    if (category === 'found') iconPath = check;

    // Create a pin shape with the icon inside or just the icon with a background?
    // "Markers use outline icons tinted by category color; pin body stays neutral."
    // Let's draw a neutral pin body (white fill, dark stroke?) and place the tinted icon inside.

    // Pin Body SVG
    const svg = `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <!-- Pin Shape -->
        <path d="M20 50 C20 50 4 30 4 18 A16 16 0 1 1 36 18 C36 30 20 50 20 50 Z" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <!-- Inner Icon Wrapper -->
        <g transform="translate(8, 6) scale(1)">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${iconPath}
             </svg>
        </g>
    </svg>`;

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
};

export const loadMarkerImages = async (map) => {
    const categories = ['positive', 'rant', 'general', 'found', 'default'];

    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            // Create an HTMLImageElement
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = url;
        });
    };

    for (const cat of categories) {
        if (map.hasImage(`marker-${cat}`)) continue;

        try {
            const url = getMarkerImage(cat);
            const image = await loadImage(url);
            map.addImage(`marker-${cat}`, image);
        } catch (error) {
            console.error(`Failed to load marker image for ${cat}:`, error);
        }
    }
};

// Helper to parse PostGIS HEX WKB string for Point geometry
const parseHexWKB = (hex) => {
    try {
        if (!hex || typeof hex !== 'string') return null;

        // Remove 0x prefix if present
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

        // Basic validation: must start with 01 (little endian) and have correct length for point (21 bytes = 42 hex chars)
        // Actually EWKB for Point with SRID is 25 bytes (1 byte order + 4 type + 4 SRID + 16 coords) = 50 hex chars
        // The logs showed: 0101000020E6100000... which is EWKB.

        // We need a DataView to parse binary data
        // Convert hex to Uint8Array
        const updatedHexString = cleanHex.length % 2 !== 0 ? '0' + cleanHex : cleanHex;
        const buffer = new Uint8Array(updatedHexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;
        const view = new DataView(buffer);

        // Byte 0: Endianness (1 = Little Endian)
        const categories = view.getUint8(0);
        const littleEndian = categories === 1;

        // Bytes 1-4: Geometry Type
        const type = view.getUint32(1, littleEndian);

        // Check for SRID flag (0x20000000)
        // If type & 0x20000000 is set, then converting as uint32 might be tricky with masks in JS, 
        // but let's just look at offsets.
        // In EWKB:
        // Byte 0: Order
        // Byte 1-4: Type (e.g., 0x20000001 for Point with SRID)
        // Byte 5-8: SRID (if present)
        // Byte 9-24: X
        // Byte 25-40: Y

        let offset = 5;

        // Check if SRID is present (EWKB uses a flag in type, usually 0x20000000)
        // Or if it's just standard WKB.
        // The logged string "0101000020" -> 01 (order) 01000020 (type).
        // 0x20000001 (Little Endian read of 01000020 is 0x20000001).

        if (type & 0x20000000) {
            // SRID present, skip 4 bytes
            offset += 4;
        }

        const x = view.getFloat64(offset, littleEndian);
        const y = view.getFloat64(offset + 8, littleEndian);

        return [x, y];

    } catch (e) {
        console.warn("WKB Parse error", e);
        return null; // Fail gracefully
    }
};

export const dbPostToFeature = (post) => {
    // Parse location_geog (or location_json from View)
    let coordinates = [0, 0];
    const loc = post.location_json || post.location_geog;

    if (loc) {
        if (typeof loc === 'object' && loc.coordinates) {
            // Handle GeoJSON (Supabase View or Object)
            coordinates = loc.coordinates;
        } else if (typeof loc === 'string') {
            if (loc.startsWith('POINT')) {
                // Handle WKT "POINT(lng lat)"
                const match = loc.match(/POINT\s*\(([-\d\.]+)[\s,]+([-\d\.]+)\)/i);
                if (match) {
                    coordinates = [parseFloat(match[1]), parseFloat(match[2])];
                    console.log("mapUtils: Parsed WKT:", coordinates);
                } else {
                    console.warn("mapUtils: Failed to match WKT regex:", loc);
                }
            } else {
                // Try Hex WKB
                const parsed = parseHexWKB(loc);
                if (parsed) {
                    coordinates = parsed;
                    console.log("mapUtils: Parsed WKB:", coordinates);
                } else {
                    console.warn("mapUtils: Failed to parse location:", loc, "Post ID:", post.id);
                }
            }
        }
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: coordinates
        },
        properties: {
            id: post.id,
            category: post.category || 'general',
            content: post.text_content, // Map 'text_content' to 'content' for UI
            timestamp: post.created_at,
            // Add other fields as needed
            author_id: post.author_user_id,
            author_alias: post.author_alias, // Added
            avatar_seed: post.avatar_seed,   // Added
            found_item_type: post.found_item_type,
            location_label: post.location_label, // Pass label to UI
            subtype: post.subtype // Ensure subtype is passed
        }
    };
};
