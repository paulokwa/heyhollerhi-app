import React, { useState, useEffect } from 'react';
import { List, GalleryHorizontal, User, LogOut } from 'lucide-react';
import { useAuth } from '../Auth/AuthProvider';
import LoginModal from '../Auth/LoginModal';
import ProfileModal from '../Auth/ProfileModal';
import Avatar from '../Auth/Avatar';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import Feed from '../Feed/Feed';
import Composer from '../Composer/Composer';
import './SidePanel.css';

const SidePanel = ({ onLocationSelect, onPostDoubleClick, filters, onFilterToggle, visiblePosts, onPostSuccess }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isWelcomeMode, setIsWelcomeMode] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'carousel'

    const { user, profile, mustCompleteProfile, signOut } = useAuth();

    // Auto-open profile modal for new users (First Run Experience)
    useEffect(() => {
        if (mustCompleteProfile) {
            setIsWelcomeMode(true);
            setIsProfileOpen(true);
        }
    }, [mustCompleteProfile]);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handlePostSubmit = async (data) => {
        try {
            // Transform MapTiler feature to { lat, lng, label }
            const feature = data.location;
            const coords = feature?.center || feature?.geometry?.coordinates || [0, 0];

            const locationPayload = {
                lng: parseFloat(coords[0]) || 0,
                lat: parseFloat(coords[1]) || 0,
                label: feature?.place_name || feature?.text || "Unknown Location"
            };

            const payload = {
                ...data,
                location: locationPayload,
                user_id: user?.id,
                author_alias: profile?.display_name || 'Anonymous', // Send alias
                avatar_seed: profile?.avatar_seed // Send avatar seed
            };

            // Get token for auth
            const { data: { session } } = await import('../../services/supabaseClient').then(m => m.supabase.auth.getSession());
            const token = session?.access_token;

            console.log("Submitting to Netlify...", payload);

            const response = await fetch('/.netlify/functions/createPost', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (response.ok) {
                console.log("Post created!");
                setIsComposing(false);
                if (onPostSuccess) onPostSuccess(feature);
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

    const handleComposeClick = () => {
        if (!user) {
            setIsLoginOpen(true);
        } else {
            setIsComposing(true);
            setIsExpanded(true);
        }
    };

    return (
        <aside className={`side-panel glass-panel ${isExpanded ? 'expanded' : ''} ${viewMode === 'carousel' ? 'carousel-mode' : ''}`}>
            {/* Mobile Drag Handle */}
            <div className="mobile-handle-bar" onClick={toggleExpand}>
                <div className="handle-pill"></div>
            </div>

            <header className="panel-header">
                <div>
                    <h1>Hey Holler Hi!</h1>
                    <p className="tagline">Local pulse, verified & vibes.</p>
                </div>

                <div className="header-actions">
                    <button
                        className="view-toggle-btn mobile-only"
                        onClick={() => setViewMode(prev => prev === 'list' ? 'carousel' : 'list')}
                        aria-label="Toggle view"
                    >
                        {viewMode === 'list' ? <GalleryHorizontal size={20} /> : <List size={20} />}
                    </button>

                    {/* Account Button */}
                    {user ? (
                        <div className="account-menu-wrapper" style={{ position: 'relative' }}>
                            <button
                                className="account-btn"
                                onClick={() => {
                                    setIsAccountMenuOpen(!isAccountMenuOpen);
                                    setIsExpanded(true);
                                }}
                                title={profile?.display_name}
                            >
                                <Avatar seed={profile?.avatar_seed || user.id} size={32} />
                            </button>

                            {isAccountMenuOpen && (
                                <div className="account-dropdown glass-panel">
                                    <div className="dropdown-user-info">
                                        <span className="dropdown-name">{profile?.display_name || 'Traveler'}</span>
                                        <span className="dropdown-email">{user.email}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={() => { setIsProfileOpen(true); setIsWelcomeMode(false); setIsAccountMenuOpen(false); }}>
                                        <User size={16} /> Profile
                                    </button>
                                    <button onClick={() => { signOut(); setIsAccountMenuOpen(false); }}>
                                        <LogOut size={16} /> Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="login-btn-header" onClick={() => setIsLoginOpen(true)}>
                            Log In
                        </button>
                    )}
                </div>
            </header>

            <div className="panel-content">
                <SearchBar onLocationSelect={onLocationSelect} />
                <FilterBar filters={filters} onToggle={onFilterToggle} />

                <Feed
                    posts={visiblePosts || []}
                    mode="explore"
                    viewMode={viewMode}
                    onPostDoubleClick={onPostDoubleClick}
                />
            </div>

            <footer className="panel-footer">
                {!isComposing && (
                    <button className="say-something-btn" onClick={handleComposeClick}>
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

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                isWelcomeMode={isWelcomeMode}
            />

            {/* Click outside listener for dropdown could go here or use a library, 
                for now simple toggle is fine but lets close it if we click elsewhere logic is omitted for brevity */}
            {isAccountMenuOpen && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                    onClick={() => setIsAccountMenuOpen(false)}
                />
            )}
        </aside>
    );
};

export default SidePanel;
