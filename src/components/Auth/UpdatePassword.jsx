import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import './UpdatePassword.css';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have a session (handled by AuthProvider, but good to double check or just rely on the flow)
        // If the user arrived here via the recovery link, Supabase sets the session automatically in the URL hash
        // which AuthProvider processes.
        // We can just focus on the form.
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage("Password updated successfully!");
            setTimeout(() => {
                navigate('/'); // Redirect to home/login after a moment
            }, 2000);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="update-password-container">
            <div className="update-password-card glass-panel">
                <div className="icon-header">
                    <div className="icon-circle">
                        <Lock size={32} color="white" />
                    </div>
                </div>
                <h2>Set New Password</h2>
                <p className="subtitle">Enter your new password below to secure your account.</p>

                <form onSubmit={handleUpdatePassword}>
                    <div className="input-group">
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                {message && (
                    <div className="status-message success">
                        <CheckCircle size={18} />
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="status-message error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdatePassword;
