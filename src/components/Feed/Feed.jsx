import React from 'react';
import { getCategoryColor } from '../../utils/mapUtils';
import { Heart, MessageCircle, AlertTriangle, Check, MapPin } from 'lucide-react';
import './Feed.css';

const PostItem = ({ post }) => {
    const { category, content, author_alias, timestamp, subtype, location_label } = post.properties;
    const color = getCategoryColor(category);

    let Icon = MapPin;
    if (category === 'positive') Icon = Heart;
    if (category === 'rant') Icon = AlertTriangle;
    if (category === 'general') Icon = MessageCircle;
    if (category === 'found') Icon = Check;

    return (
        <div className="post-card glass-panel" style={{ borderLeftColor: color }}>
            <div className="post-header">
                {location_label ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        <MapPin size={12} />
                        <span>{location_label}</span>
                    </div>
                ) : (
                    <span></span>
                )}
                <span className="post-time">
                    {new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {content && <p className="post-content">{content}</p>}

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
                <span className="post-alias" style={{ color: color, fontSize: '0.75rem', opacity: 0.8 }}>{author_alias}</span>
            </div>
        </div>
    );
};

const Feed = ({ posts, mode }) => {
    if (posts.length === 0) {
        return (
            <div className="empty-feed">
                <p>No posts in this area.</p>
                <small>Be the first to share!</small>
            </div>
        );
    }

    return (
        <div className="feed-list">
            {posts.map(post => (
                <PostItem key={post.properties.id || Math.random()} post={post} />
            ))}
        </div>
    );
};

export default Feed;
