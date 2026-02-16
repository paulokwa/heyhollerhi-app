import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import Avatar from './Avatar';
import { generateName } from '../../utils/nameGenerator';
import { X, RefreshCw, Save, Trash2, LogOut } from 'lucide-react';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose, isWelcomeMode }) => {
    const { user, profile, updateProfile, completeProfile, signOut } = useAuth();

    // Local state for editing form
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarSeed, setAvatarSeed] = useState('');

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

    const handleDeleteAccount = async () => {
        if (deleteInput !== 'DELETE') return;

        setLoading(true);
        try {
            const token = (await import('../../services/supabaseClient')).supabase.auth.getSession().then(({ data }) => data.session?.access_token);
            // In a real app we'd pass the token. Currently supabase client handles auth headers automatically if we used supabase functions.
            // But we are using a raw fetch to netlify function.

            const session = await (await import('../../services/supabaseClient')).supabase.auth.getSession();
            const accessToken = session.data.session?.access_token;

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

                <h2>{isWelcomeMode ? 'Welcome, Traveler!' : 'Edit Profile'}</h2>
                {isWelcomeMode && <p className="welcome-text">We've generated a persona for you. Keep it or customize it!</p>}

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

                    {message && <div className={`status-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? 'Saving...' : (isWelcomeMode ? 'Start Exploring' : 'Save Changes')}
                        {!loading && <Save size={18} style={{ marginLeft: '8px' }} />}
                    </button>
                </form>

                {!isWelcomeMode && (
                    <div className="account-actions">
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
                                <p>Type <strong>DELETE</strong> to confirm.</p>
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
            </div>
        </div>
    );
};

export default ProfileModal;
