import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
    const [secret, setSecret] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    const handleLogin = (e) => {
        e.preventDefault();
        fetchData(secret);
    };

    const fetchData = async (paramsSecret) => {
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

    // Initial fetch on mount if already authenticated (updates list)
    useEffect(() => {
        if (isAuthenticated) {
            fetchData(secret);
        }
    }, [isAuthenticated]);

    const handleAction = async (action, targetId) => {
        if (!confirm(`Are you sure you want to ${action === 'delete_post' ? 'delete' : 'ban user for'} this item?`)) return;

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
                fetchData(secret);
            } else {
                alert("Action failed");
            }
        } catch (e) {
            alert(e.message);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedPosts = [...posts].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <span className="sort-icon">⇅</span>;
        return <span className="sort-icon">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login">
                <h1>Admin Access</h1>
                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        id="adminSecret"
                        name="adminSecret"
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
                <div className="admin-controls">
                    <span className="user-status">Logged in</span>
                    <button onClick={() => setIsAuthenticated(false)}>Logout</button>
                </div>
            </header>

            <div className="admin-content">
                <div className="list-controls">
                    <button onClick={() => fetchData(secret)}>Refresh List</button>
                </div>

                <table className="posts-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('created_at')}>Time <SortIcon column="created_at" /></th>
                            <th onClick={() => handleSort('status')}>Status <SortIcon column="status" /></th>
                            <th onClick={() => handleSort('category')}>Category <SortIcon column="category" /></th>
                            <th onClick={() => handleSort('location_label')}>Location <SortIcon column="location_label" /></th>
                            <th>Content</th>
                            <th>IP / User</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPosts.map(item => (
                            <tr key={item.id} className={`status-${item.status}`}>
                                <td>{new Date(item.created_at).toLocaleString()}</td>
                                <td>{item.status}</td>
                                <td>{item.category}</td>
                                <td>{item.location_label || <span className="text-muted">N/A</span>}</td>
                                <td>
                                    {item.text_content || (
                                        <span className="found-meta">
                                            {item.found_item_type} ({item.found_item_class})
                                        </span>
                                    )}
                                </td>
                                <td>{item.author_user_id ? 'App User' : (item.author_ip || 'N/A')}</td>
                                <td>
                                    {item.status !== 'removed' && (
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleAction('delete_post', item.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                    <button
                                        className="btn-ban"
                                        onClick={() => handleAction('ban_user', item.author_user_id)}
                                    >
                                        Ban
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
