import React, { useState } from 'react';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import Feed from '../Feed/Feed';
import Composer from '../Composer/Composer';
import './SidePanel.css';

const SidePanel = ({ onLocationSelect, filters, onFilterToggle, visiblePosts, onPostSuccess }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isComposing, setIsComposing] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handlePostSubmit = async (data) => {
        try {
            // Get location from where? Ideally the map center or user location?
            // For now, let's assume we want to post at the current Map center (which we don't have access to here easily)
            // OR we pass it in. 
            // BETTER: Composer should ask for location or use current map center. 
            // Let's grab it from a prop or context.
            // Simplified: We'll fake the location as the last flyToLocation or we need to pass `mapCenter` to SidePanel.
            // This is a missing connect. 
            // For this step, I'll validly log it, but we need to wire up map center. 
            // I'll update AppLayout to pass `mapCenter`.
            console.log("Submitting to Netlify...", data);

            const response = await fetch('/.netlify/functions/createPost', {
                method: 'POST',
                body: JSON.stringify({ ...data, location: window.currentMapCenter || { lat: 0, lng: 0 } }), // HACK for now
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log("Post created!");
                setIsComposing(false);
                if (onPostSuccess) onPostSuccess();
            } else if (response.status === 429) {
                const err = await response.json();
                alert(err.error || "You're posting too fast! Take a breather.");
            } else {
                const err = await response.json().catch(() => ({}));
                console.error("Post failed", err);
                alert("Failed to post: " + (err.error || "Unknown error"));
            }

        } catch (e) {
            console.error("Error submitting", e);
        }
    };

    return (
        <aside className={`side-panel glass-panel ${isExpanded ? 'expanded' : ''}`}>
            {/* Mobile Drag Handle */}
            <div className="mobile-handle-bar" onClick={toggleExpand}>
                <div className="handle-pill"></div>
            </div>

            <header className="panel-header">
                <h1>HeyHollerHi</h1>
                <p className="tagline">Local pulse, verified & vibes.</p>
            </header>

            <div className="panel-content">
                <SearchBar onLocationSelect={onLocationSelect} />
                <FilterBar filters={filters} onToggle={onFilterToggle} />

                <Feed posts={visiblePosts || []} mode="explore" />
            </div>

            <footer className="panel-footer">
                {!isComposing && (
                    <button className="say-something-btn" onClick={() => {
                        setIsComposing(true);
                        setIsExpanded(true); // Auto-expand on compose
                    }}>
                        Say something...
                    </button>
                )}
                {isComposing && (
                    <div style={{ padding: '10px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Composing...
                    </div>
                )}
            </footer>

            {isComposing && (
                <Composer onClose={() => setIsComposing(false)} onSubmit={handlePostSubmit} />
            )}
        </aside>
    );
};

export default SidePanel;
