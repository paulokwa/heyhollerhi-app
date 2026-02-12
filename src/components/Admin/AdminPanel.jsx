import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
    const [secret, setSecret] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hardcoded client-side check for UX only. Real security is server-side.
    // Ideally this matches the env var ADMIN_SECRET.
    // For MVP, we'll ask the user to enter it.

    const handleLogin = (e) => {
        e.preventDefault();
        // We don't validate client-side per se, we just use this secret for requests.
        // If the server accepts it, we're good.
        fetchPosts(secret);
    };

    const fetchPosts = async (paramsSecret) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/.netlify/functions/adminAction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': paramsSecret || secret
                },
                body: JSON.stringify({ action: 'list_posts' })
            });

            if (response.ok) {
                const data = await response.json();
                setPosts(data);
                setIsAuthenticated(true);
                if (paramsSecret) setSecret(paramsSecret);
            } else {
                setIsAuthenticated(false);
                setError("Invalid Secret or Server Error");
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action, targetId) => {
        if (!confirm(`Are you sure you want to ${action} this item?`)) return;

        try {
            const response = await fetch('/.netlify/functions/adminAction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': secret
                },
                body: JSON.stringify({ action, target_id: targetId })
            });

            if (response.ok) {
                // Refresh list
                fetchPosts();
            } else {
                alert("Action failed");
            }
        } catch (e) {
            alert(e.message);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login">
                <h1>Admin Access</h1>
                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        placeholder="Enter Admin Secret"
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Checking...' : 'Enter'}
                    </button>
                    {error && <p className="error">{error}</p>}
                </form>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <header>
                <h1>Moderation Dashboard</h1>
                <button onClick={() => setIsAuthenticated(false)}>Logout</button>
            </header>

            <div className="admin-content">
                <button onClick={() => fetchPosts()}>Refresh List</button>

                <table className="posts-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Category</th>
                            <th>Content</th>
                            <th>IP</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map(post => (
                            <tr key={post.id} className={`status-${post.status}`}>
                                <td>{new Date(post.created_at).toLocaleString()}</td>
                                <td>{post.status}</td>
                                <td>{post.category}</td>
                                <td>
                                    {post.text_content || (
                                        <span className="found-meta">
                                            {post.found_item_type} ({post.found_item_class})
                                        </span>
                                    )}
                                </td>
                                <td>{post.author_ip || 'N/A'}</td>
                                <td>
                                    {post.status !== 'removed' && (
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleAction('delete_post', post.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                    <button
                                        className="btn-ban"
                                        onClick={() => handleAction('ban_user', post.author_user_id)}
                                    >
                                        Ban IP
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;
