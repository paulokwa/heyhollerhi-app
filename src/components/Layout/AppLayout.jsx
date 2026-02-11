import React from 'react';
import MapContainer from '../Map/MapContainer';
import SidePanel from '../Panel/SidePanel';
import { MOCK_POSTS } from '../../data/mockPosts';
import './AppLayout.css';

const AppLayout = () => {
    const [flyToLocation, setFlyToLocation] = React.useState(null);
    const [filters, setFilters] = React.useState({
        positive: true,
        rant: false,
        general: true,
        found: true
    });
    const [visiblePosts, setVisiblePosts] = React.useState([]);

    const handleFilterToggle = (id) => {
        setFilters(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleLocationSelect = (feature) => {
        if (feature && feature.center) {
            setFlyToLocation({ center: feature.center, zoom: 14 });
        }
    };

    const handleBoundsChange = (bounds) => {
        if (!bounds) return;

        // Simple client-side bounds check on MOCK_POSTS
        const visible = MOCK_POSTS.features.filter(p => {
            const [lng, lat] = p.geometry.coordinates;
            // Check Filters (optional here if we want list to match map immediately)
            // Ideally we match map filters.
            if (!filters[p.properties.category]) return false;

            return (
                lng >= bounds._sw.lng &&
                lng <= bounds._ne.lng &&
                lat >= bounds._sw.lat &&
                lat <= bounds._ne.lat
            );
        });

        // Sort by timestamp desc (newest first)
        // Mock data timestamps are ISO strings
        visible.sort((a, b) => new Date(b.properties.timestamp) - new Date(a.properties.timestamp));

        setVisiblePosts(visible);
    };

    // Re-filter when filters change using current visiblePosts is hard without bounds.
    // For MVP, we wait for next move or we just filter the *currently* visible posts?
    // Better: We need to know current bounds. 
    // Let's just rely on MapContainer triggering 'moveend' or us triggering it?
    // Actually, `MapContainer` filtering handles the MAP. 
    // The LIST needs to be consistent. 
    // Limit: List only updates on map move for now. 
    // (To fix: store bounds in state, re-run filter in useEffect).

    const [currentBounds, setCurrentBounds] = React.useState(null);

    React.useEffect(() => {
        if (currentBounds) {
            handleBoundsChange(currentBounds);
            // HACK: Store center globally for Composer availability (easier than prop drilling 4 layers for MVP)
            // Ideally use Context or separate MapState
            window.currentMapCenter = {
                lng: (currentBounds._ne.lng + currentBounds._sw.lng) / 2,
                lat: (currentBounds._ne.lat + currentBounds._sw.lat) / 2
            };
        }
    }, [filters, currentBounds]);


    return (
        <div className="app-layout">
            <div className="map-wrapper">
                <MapContainer
                    flyToLocation={flyToLocation}
                    filters={filters}
                    onBoundsChange={setCurrentBounds}
                />
            </div>
            <SidePanel
                onLocationSelect={handleLocationSelect}
                filters={filters}
                onFilterToggle={handleFilterToggle}
                visiblePosts={visiblePosts}
            />
        </div>
    );
};

export default AppLayout;
