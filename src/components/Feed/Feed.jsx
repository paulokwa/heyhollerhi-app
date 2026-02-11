import React from 'react';
import { getCategoryColor } from '../../utils/mapUtils';
import { Heart, MessageCircle, AlertTriangle, Check, MapPin } from 'lucide-react';
import './Feed.css';

const PostItem = ({ post }) => {
    const { category, content, author_alias, timestamp, subtype } = post.properties;
    const color = getCategoryColor(category);

    let Icon = MapPin;
    if (category === 'positive') Icon = Heart;
    if (category === 'rant') Icon = AlertTriangle;
    if (category === 'general') Icon = MessageCircle;
    if (category === 'found') Icon = Check;

    return (
        <div className="post-card glass-panel" style={{ borderLeftColor: color }}>
            <div className="post-header">
                <span className="post-alias" style={{ color: color }}>{author_alias}</span>
                <span className="post-time">{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {content && <p className="post-content">{content}</p>}
            {category === 'found' && (
                <div className="found-badge" style={{ backgroundColor: color }}>
                    <Icon size={12} color="white" />
                    <span>Found Item</span>
                </div>
            )}
            <div className="post-footer">
                <span className="post-category">{category} {subtype ? `• ${subtype}` : ''}</span>
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
