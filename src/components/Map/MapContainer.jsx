import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapContainer.css';

const MapContainer = ({ theme = 'dark', flyToLocation, postsData, onBoundsChange }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // Default View (World/Globe)
    const [lng] = useState(0);
    const [lat] = useState(20);
    const [zoom] = useState(2);

    const API_KEY = import.meta.env.VITE_MAPTILER_KEY;

    // 1. Initialize Map
    useEffect(() => {
        if (map.current) return;
        if (!API_KEY) return;

        const mapStyle = theme === 'light' ? 'streets-v2' : 'streets-v2-dark';

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${API_KEY}`,
            center: [lng, lat],
            zoom: zoom,
            projection: 'globe',
            attributionControl: false,
        });

        map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
        map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');

        map.current.on('load', async () => {
            // Load custom marker images dynamically
            try {
                const { loadMarkerImages } = await import('../../utils/mapUtils');
                await loadMarkerImages(map.current);
            } catch (e) {
                console.error("Failed to load marker images:", e);
            }

            // Add Source with empty or initial data
            map.current.addSource('posts', {
                type: 'geojson',
                data: postsData || { type: 'FeatureCollection', features: [] },
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
                clusterProperties: {
                    'positive': ['+', ['case', ['==', ['get', 'category'], 'positive'], 1, 0]],
                    'rant': ['+', ['case', ['==', ['get', 'category'], 'rant'], 1, 0]],
                    'general': ['+', ['case', ['==', ['get', 'category'], 'general'], 1, 0]],
                    'found': ['+', ['case', ['==', ['get', 'category'], 'found'], 1, 0]],
                }
            });

            // Layers (same as before)
            map.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'posts',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'case',
                        ['==', ['get', 'positive'], ['get', 'point_count']], '#10b981',
                        ['==', ['get', 'rant'], ['get', 'point_count']], '#f43f5e',
                        ['==', ['get', 'general'], ['get', 'point_count']], '#3b82f6',
                        ['==', ['get', 'found'], ['get', 'point_count']], '#eab308',
                        '#94a3b8'
                    ],
                    'circle-radius': 20,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });

            map.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'posts',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                },
                paint: { 'text-color': '#ffffff' }
            });

            map.current.addLayer({
                id: 'unclustered-point',
                type: 'symbol',
                source: 'posts',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': [
                        'match',
                        ['get', 'category'],
                        'positive', 'marker-positive',
                        'rant', 'marker-rant',
                        'general', 'marker-general',
                        'found', 'marker-found',
                        'marker-default'
                    ],
                    'icon-size': 0.8,
                    'icon-allow-overlap': true
                }
            });

            // Report Bounds
            map.current.on('moveend', (e) => {
                const bounds = map.current.getBounds();
                const userInitiated = !!e.originalEvent; // True if triggered by user input (mouse/touch/keyboard)
                if (onBoundsChange) onBoundsChange(bounds, userInitiated);
            });

            // Initial bounds report (programmatic)
            if (onBoundsChange) onBoundsChange(map.current.getBounds(), false);

            setIsMapLoaded(true);
        });

        // Interactions
        map.current.on('click', 'clusters', (e) => {
            const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = features[0].properties.cluster_id;
            map.current.getSource('posts').getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;
                map.current.easeTo({ center: features[0].geometry.coordinates, zoom: zoom });
            });
        });

        map.current.on('mouseenter', 'clusters', () => map.current.getCanvas().style.cursor = 'pointer');
        map.current.on('mouseleave', 'clusters', () => map.current.getCanvas().style.cursor = '');

        map.current.on('click', 'unclustered-point', (e) => {
            const feature = e.features[0];
            console.log('Selected post:', feature.properties);
            map.current.flyTo({
                center: feature.geometry.coordinates,
                zoom: 15,
                speed: 1.2,
                curve: 1,
                essential: true
            });
        });

        map.current.on('mouseleave', 'unclustered-point', () => map.current.getCanvas().style.cursor = '');

    }, []);

    // 2. FlyTo Effect
    useEffect(() => {
        if (!map.current || !flyToLocation) return;
        map.current.flyTo({
            center: flyToLocation.center,
            zoom: flyToLocation.zoom || 14,
            speed: 1.5,
            curve: 1,
            essential: true
        });
    }, [flyToLocation]);

    // 3. Data Update Effect
    useEffect(() => {
        if (!isMapLoaded || !map.current || !map.current.getSource('posts') || !postsData) return;
        map.current.getSource('posts').setData(postsData);
    }, [postsData, isMapLoaded]);

    // 4. Resize Logic
    useEffect(() => {
        const handleResize = () => {
            if (!map.current) return;
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                map.current.setPadding({ top: 0, bottom: 300, left: 0, right: 0 });
            } else {
                map.current.setPadding({ top: 0, bottom: 0, left: 0, right: 400 });
            }
        };

        window.addEventListener('resize', handleResize);
        if (isMapLoaded) handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [isMapLoaded]);

    if (!API_KEY) return <div className="map-error">Pending Configuration...</div>;

    return (
        <div className="map-wrap">
            <div ref={mapContainer} className="map" />
        </div>
    );
};

export default MapContainer;
