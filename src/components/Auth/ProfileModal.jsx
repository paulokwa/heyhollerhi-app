import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import Avatar from './Avatar';
import MyPosts from '../../components/Profile/MyPosts';
import { generateName } from '../../utils/nameGenerator';
import { X, RefreshCw, Save, Trash2, LogOut, Download, List } from 'lucide-react';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose, isWelcomeMode }) => {
    const { user, profile, updateProfile, completeProfile, signOut } = useAuth();

    // Local state for editing form
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarSeed, setAvatarSeed] = useState('');
    const [view, setView] = useState('edit'); // 'edit' | 'posts'

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');

    // Load profile data when modal opens or profile changes
    useEffect(() => {
        if (isOpen && profile) {
            setDisplayName(profile.display_name || '');
            setBio(profile.bio || '');
            setAvatarSeed(profile.avatar_seed || user?.id || 'default');
            setMessage(null);
            setIsDeleteConfirmOpen(false);
            setView('edit');
        }
    }, [isOpen, profile, user]);

    if (!isOpen) return null;

    const handleGenerateAvatar = () => {
        setAvatarSeed(crypto.randomUUID());
    };

    const handleGenerateName = () => {
        setDisplayName(generateName());
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await updateProfile({
                display_name: displayName,
                bio: bio,
                avatar_seed: avatarSeed
            });

            setMessage('Profile saved!');

            if (isWelcomeMode) {
                completeProfile();
                setTimeout(() => onClose(), 1000);
            }
        } catch (error) {
            console.error(error);
            setMessage('Error saving profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        onClose();
    };

    const handleExportData = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await (await import('../../services/supabaseClient')).supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/.netlify/functions/exportData', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setMessage('Data exported successfully.');
        } catch (err) {
            console.error(err);
            setMessage('Failed to export data.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== 'DELETE') return;

        setLoading(true);
        try {
            const { data: { session } } = await (await import('../../services/supabaseClient')).supabase.auth.getSession();
            const accessToken = session?.access_token;

            const response = await fetch('/.netlify/functions/deleteAccount', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                await signOut();
                window.location.reload();
            } else {
                const err = await response.json();
                alert('Failed to delete: ' + err.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-modal-overlay">
            <div className="profile-modal glass-panel">
                {!isWelcomeMode && (
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                )}

                <h2>
                    {view === 'posts' ? 'My Posts' : (isWelcomeMode ? 'Welcome, Traveler!' : 'Edit Profile')}
                </h2>

                {isWelcomeMode && <p className="welcome-text">We've generated a persona for you. Keep it or customize it!</p>}

                {view === 'edit' ? (
                    <>
                        <div className="avatar-section">
                            <Avatar seed={avatarSeed} size={100} className="large-avatar" />
                            <button type="button" className="refresh-btn" onClick={handleGenerateAvatar} title="Generate new avatar">
                                <RefreshCw size={16} /> New Look
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="profile-form">
                            <div className="form-group">
                                <label>Display Name</label>
                                <div className="input-with-action">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        maxLength={30}
                                        required
                                    />
                                    <button type="button" onClick={handleGenerateName} title="Generate new name">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Bio (Optional)</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    maxLength={160}
                                    rows={3}
                                    placeholder="Tell the map who you are..."
                                />
                                <div className="char-count">{bio.length}/160</div>
                            </div>

                            {message && <div className={`status-message ${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>}

                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? 'Saving...' : (isWelcomeMode ? 'Start Exploring' : 'Save Changes')}
                                {!loading && <Save size={18} style={{ marginLeft: '8px' }} />}
                            </button>
                        </form>

                        {!isWelcomeMode && (
                            <div className="account-actions">
                                <div className="action-row">
                                    <button className="secondary-action-btn" onClick={() => setView('posts')}>
                                        <List size={16} /> Manage My Posts
                                    </button>
                                    <button className="secondary-action-btn" onClick={handleExportData} disabled={loading}>
                                        <Download size={16} /> Export My Data
                                    </button>
                                </div>

                                <button className="logout-btn" onClick={handleLogout}>
                                    <LogOut size={16} /> Log Out
                                </button>

                                <div className="divider"></div>

                                {!isDeleteConfirmOpen ? (
                                    <button className="delete-btn" onClick={() => setIsDeleteConfirmOpen(true)}>
                                        Delete Account
                                    </button>
                                ) : (
                                    <div className="delete-confirm">
                                        <p className="warning-text">
                                            <strong>Warning:</strong> This will anonymize your profile and posts.
                                            You will lose access to this account immediately.
                                            Type <strong>DELETE</strong> to confirm.
                                        </p>
                                        <div className="delete-confirm-row">
                                            <input
                                                type="text"
                                                value={deleteInput}
                                                onChange={e => setDeleteInput(e.target.value)}
                                                placeholder="DELETE"
                                            />
                                            <button
                                                className="confirm-delete-btn"
                                                disabled={deleteInput !== 'DELETE' || loading}
                                                onClick={handleDeleteAccount}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="cancel-delete-btn" onClick={() => setIsDeleteConfirmOpen(false)}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="my-posts-view">
                        <MyPosts userId={user?.id} />
                        <button className="back-btn" onClick={() => setView('edit')}>
                            Back to Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileModal;
