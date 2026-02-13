const API_KEY = import.meta.env.VITE_MAPTILER_KEY;

export const searchLocation = async (query) => {
    if (!query) return [];
    
    try {
        const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data.features || [];
    } catch (err) {
        console.error("Geocoding service error:", err);
        return [];
    }
};
