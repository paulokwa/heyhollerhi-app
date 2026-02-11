export const MOCK_POSTS = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {
                id: 1,
                category: 'positive',
                subtype: 'gratitude',
                content: 'Amazing sunset at the pier today! 🌅',
                author_alias: 'Happy Clam',
                timestamp: new Date().toISOString()
            },
            geometry: { type: 'Point', coordinates: [-74.006, 40.7128] } // NYC
        },
        {
            type: 'Feature',
            properties: {
                id: 2,
                category: 'rant',
                subtype: 'traffic',
                content: 'Why is this lane always closed??',
                author_alias: 'Grumpy Cat',
                timestamp: new Date().toISOString()
            },
            geometry: { type: 'Point', coordinates: [-73.98, 40.73] } // NYC
        },
        {
            type: 'Feature',
            properties: {
                id: 3,
                category: 'general',
                subtype: 'chat',
                content: 'Best bagel spot around here?',
                author_alias: 'Hungry Hippo',
                timestamp: new Date().toISOString()
            },
            geometry: { type: 'Point', coordinates: [-74.01, 40.70] } // NYC
        },
        {
            type: 'Feature',
            properties: {
                id: 4,
                category: 'found',
                subtype: 'keys',
                item_type: 'keys',
                content: null,
                author_alias: 'Helpful Badger',
                timestamp: new Date().toISOString()
            },
            geometry: { type: 'Point', coordinates: [-73.95, 40.80] } // Harlem
        },
        {
            type: 'Feature',
            properties: {
                id: 5,
                category: 'positive',
                content: 'Love this park!',
                author_alias: 'Nature Boy',
                timestamp: new Date().toISOString()
            },
            geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] } // London
        },
        {
            type: 'Feature',
            properties: {
                id: 6,
                category: 'positive',
                content: 'Great coffee!',
                author_alias: 'Latte Lover',
                timestamp: new Date().toISOString()
            },
            geometry: { type: 'Point', coordinates: [-74.0061, 40.7129] } // Near NYC 1
        }
    ]
};
