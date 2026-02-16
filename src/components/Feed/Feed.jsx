import React from 'react';
import { getCategoryColor } from '../../utils/mapUtils';
import { Heart, MessageCircle, AlertTriangle, Check, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '../Auth/Avatar';
import './Feed.css';

const PostItem = ({ post, onDoubleClick }) => {
    const { category, content, author_alias, avatar_seed, timestamp, subtype, location_label } = post.properties;
    const color = getCategoryColor(category);
    const [isExpanded, setIsExpanded] = React.useState(false);

    let Icon = MapPin;
    if (category === 'positive') Icon = Heart;
    if (category === 'rant') Icon = AlertTriangle;
    if (category === 'general') Icon = MessageCircle;
    if (category === 'found') Icon = Check;

    // Truncation Logic
    const TEXT_LIMIT = 100;
    const shouldTruncate = content && content.length > TEXT_LIMIT;
    const displayedContent = isExpanded || !shouldTruncate ? content : content.slice(0, TEXT_LIMIT) + '...';

    return (
        <div
            className="post-card glass-panel"
            style={{ borderLeftColor: color, cursor: 'pointer' }}
            onDoubleClick={onDoubleClick}
            title="Double-click to zoom map"
        >
            <div className="post-header">
                {location_label ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        <div style={{ marginTop: '2px', display: 'flex' }}>
                            <MapPin size={14} />
                        </div>
                        <span style={{ lineHeight: '1.2' }}>{location_label}</span>
                    </div>
                ) : (
                    <span></span>
                )}
                <span className="post-time">
                    {new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {content && (
                <div className="post-content-wrapper">
                    <p className="post-content">
                        {displayedContent}
                        {shouldTruncate && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                className="see-more-btn"
                                style={{ color: color }}
                            >
                                {isExpanded ? ' See Less' : ' See More'}
                            </button>
                        )}
                    </p>
                </div>
            )}

            {category === 'found' && (
                <div className="found-badge" style={{ backgroundColor: color }}>
                    <Icon size={12} color="white" />
                    <span>Found Item</span>
                </div>
            )}

            <div className="post-footer" style={{ justifyContent: 'space-between', marginTop: '10px' }}>
                <div className="post-category-badge" style={{ color: color, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
                    <Icon size={14} />
                    <span>{category} {subtype ? `• ${subtype}` : ''}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="post-alias" style={{ color: color, fontSize: '0.75rem', opacity: 0.8 }}>{author_alias}</span>
                    <Avatar seed={avatar_seed || author_alias} size={24} />
                </div>
            </div>
        </div>
    );
};

const Feed = ({ posts, mode, viewMode = 'list', onPostDoubleClick }) => {
    const carouselRef = React.useRef(null);

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const width = carouselRef.current.offsetWidth;
            const scrollAmount = direction === 'next' ? width : -width;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (posts.length === 0) {
        return (
            <div className="empty-feed">
                <p>No posts in this area.</p>
                <small>Be the first to share!</small>
            </div>
        );
    }

    if (viewMode === 'carousel') {
        return (
            <div className="feed-carousel-layout">
                <div className="feed-carousel-track" ref={carouselRef}>
                    {posts.map(post => (
                        <div key={post.properties.id || Math.random()} className="carousel-item">
                            <PostItem
                                post={post}
                                onDoubleClick={() => onPostDoubleClick && onPostDoubleClick(post)}
                            />
                        </div>
                    ))}
                </div>
                <div className="carousel-controls">
                    <button className="carousel-btn" onClick={() => scrollCarousel('prev')} aria-label="Previous">
                        <ChevronLeft size={24} />
                    </button>
                    <span className="carousel-indicator">{posts.length} posts</span>
                    <button className="carousel-btn" onClick={() => scrollCarousel('next')} aria-label="Next">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="feed-list">
            {posts.map(post => (
                <PostItem
                    key={post.properties.id || Math.random()}
                    post={post}
                    onDoubleClick={() => onPostDoubleClick && onPostDoubleClick(post)}
                />
            ))}
        </div>
    );
};

export default Feed;
