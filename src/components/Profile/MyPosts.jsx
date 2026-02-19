import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Trash2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './MyPosts.css';

const MyPosts = ({ userId }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null); // ID of post being deleted

    useEffect(() => {
        if (userId) {
            fetchMyPosts();
        }
    }, [userId]);

    const fetchMyPosts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('author_user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching my posts:', err);
            setError('Failed to load posts.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post? It will be hidden from the public feed.')) {
            return;
        }

        setDeleteLoading(postId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const response = await fetch('/.netlify/functions/deletePost', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ postId })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete');
            }

            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, is_deleted: true, deleted_at: new Date().toISOString() }
                    : p
            ));

        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete post: ' + err.message);
        } finally {
            setDeleteLoading(null);
        }
    };

    if (loading) return <div className="my-posts-loading">Loading posts...</div>;
    if (error) return <div className="my-posts-error">{error}</div>;

    return (
        <div className="my-posts-container">
            <h3>My Posts</h3>
            {posts.length === 0 ? (
                <p className="no-posts">You haven't posted anything yet.</p>
            ) : (
                <ul className="my-posts-list">
                    {posts.map(post => {
                        const isDeleted = post.is_deleted;
                        const borderColor = isDeleted ? '#ef4444' : (
                            post.category === 'positive' ? '#10b981' :
                                post.category === 'rant' ? '#ef4444' :
                                    post.category === 'found' ? '#3b82f6' : '#64748b'
                        );

                        return (
                            <li key={post.id} className={`my-post-item ${isDeleted ? 'deleted' : ''}`} style={{ borderLeft: `4px solid ${borderColor}` }}>
                                <div style={{ flex: 1 }}>
                                    <div className="post-info">
                                        {isDeleted && <span className="status-badge deleted">Deleted</span>}
                                        {!isDeleted && <span className="status-badge active" style={{ color: borderColor }}>Active</span>}
                                        <span className="post-date">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="post-preview">
                                        {post.text_content || `(Found Item: ${post.found_item_type})`}
                                    </p>
                                </div>

                                {!isDeleted && (
                                    <button
                                        className="delete-post-btn"
                                        onClick={() => handleDelete(post.id)}
                                        disabled={deleteLoading === post.id}
                                        title="Delete this post"
                                    >
                                        {deleteLoading === post.id ? '...' : <Trash2 size={16} />}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default MyPosts;
