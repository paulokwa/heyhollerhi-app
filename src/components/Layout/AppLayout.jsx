import React from 'react';
import MapContainer from '../Map/MapContainer';
import SidePanel from '../Panel/SidePanel';
// import { MOCK_POSTS } from '../../data/mockPosts'; // Removed
import { supabase } from '../../services/supabaseClient';
import { dbPostToFeature } from '../../utils/mapUtils';
import './AppLayout.css';

const AppLayout = () => {
    const [flyToLocation, setFlyToLocation] = React.useState(null);
    const [filters, setFilters] = React.useState({
        positive: true,
        rant: false,
        general: true,
        found: true
    });

    const [allFeatures, setAllFeatures] = React.useState([]); // All posts as features
    const [visiblePosts, setVisiblePosts] = React.useState([]); // Posts in current view/filter
    const [currentBounds, setCurrentBounds] = React.useState(null);
    const [searchBounds, setSearchBounds] = React.useState(null); // New: Stores bounds from search result

    // Fetch Posts
    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(500); // MVP limit

            if (error) {
                console.error("Error fetching posts:", error);
                return;
            }

            if (data) {
                const features = data.map(dbPostToFeature);
                setAllFeatures(features);
            }
        } catch (e) {
            console.error("Fetch exception:", e);
        }
    };

    // Initial Fetch
    React.useEffect(() => {
        fetchPosts();
    }, []);

    const handleFilterToggle = (id) => {
        setFilters(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleLocationSelect = (feature) => {
        if (feature) {
            // 1. Fly to location
            if (feature.center) {
                setFlyToLocation({ center: feature.center, zoom: 14 });
            }

            // 2. Set Search Bounds (for "Search Mode")
            if (feature.bbox) {
                // Feature has a bounding box (e.g. Country, City)
                setSearchBounds({
                    _sw: { lng: feature.bbox[0], lat: feature.bbox[1] },
                    _ne: { lng: feature.bbox[2], lat: feature.bbox[3] }
                });
            } else if (feature.center) {
                // Point result (e.g. Address), create a small buffer or just rely on viewport
                // For now, let's just clear search bounds and rely on viewport for point results
                // OR we can synthesize a small bound. Let's rely on viewport for points.
                setSearchBounds(null);
            }
        }
    };

    const handleBoundsChange = (bounds, userInitiated) => {
        if (!bounds) return;
        setCurrentBounds(bounds);

        // If user manually moves map, clear search mode
        if (userInitiated) {
            setSearchBounds(null);
        }
    };

    // Effect to update visiblePosts and expose map center
    React.useEffect(() => {
        // Use searchBounds if active, otherwise currentBounds
        const activeBounds = searchBounds || currentBounds;

        if (!activeBounds) return;

        // 1. Filter allFeatures based on filters AND bounds
        const visible = allFeatures.filter(p => {
            const [lng, lat] = p.geometry.coordinates;
            // Check Category Filter
            if (!filters[p.properties.category]) return false;

            // Check Bounds
            return (
                lng >= activeBounds._sw.lng &&
                lng <= activeBounds._ne.lng &&
                lat >= activeBounds._sw.lat &&
                lat <= activeBounds._ne.lat
            );
        });

        setVisiblePosts(visible);

        // Update global map center for composer (always use actual map center)
        if (currentBounds) {
            window.currentMapCenter = {
                lng: (currentBounds._ne.lng + currentBounds._sw.lng) / 2,
                lat: (currentBounds._ne.lat + currentBounds._sw.lat) / 2
            };
        }

    }, [filters, currentBounds, searchBounds, allFeatures]);


    // Derived prop for MapContainer: Just the filtered features for the whole world
    // MapContainer will render them all, maplibre handles viewport clipping.
    // We only filter by CATEGORY for the map source.
    const mapFeatures = React.useMemo(() => {
        return allFeatures.filter(f => filters[f.properties.category]);
    }, [allFeatures, filters]);

    const postsCollection = {
        type: 'FeatureCollection',
        features: mapFeatures
    };

    return (
        <div className="app-layout">
            <div className="map-wrapper">
                <MapContainer
                    flyToLocation={flyToLocation}
                    // filters={filters} // MapContainer doesn't need filters anymore if we pass filtered data
                    postsData={postsCollection} // Pass real data
                    onBoundsChange={handleBoundsChange}
                />
            </div>
            <SidePanel
                onLocationSelect={handleLocationSelect}
                filters={filters}
                onFilterToggle={handleFilterToggle}
                visiblePosts={visiblePosts}
                onPostSuccess={fetchPosts} // Trigger refresh on post
            />
        </div>
    );
};

export default AppLayout;
