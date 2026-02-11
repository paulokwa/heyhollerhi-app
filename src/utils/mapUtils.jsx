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

    for (const cat of categories) {
        if (map.hasImage(`marker-${cat}`)) continue;

        const url = getMarkerImage(cat);
        const response = await fetch(url);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        map.addImage(`marker-${cat}`, bitmap); // SDF false, we bake color in.
    }
};
