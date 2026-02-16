import React, { useState } from 'react';
import { useAuth } from '../Auth/AuthProvider'; // Adjust path if needed
import { X, Mail, Lock, Check } from 'lucide-react';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose }) => {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
                onClose();
            } else if (mode === 'signup') {
                await signUpWithEmail(email, password);
                setMessage('Check your email for the confirmation link!');
                setMode('login'); // Switch to login view or keep message
            } else if (mode === 'forgot') {
                await resetPassword(email);
                setMessage('Password reset email sent!');
                setMode('login');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-modal-overlay">
            <div className="login-modal glass-panel">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>

                <h2>
                    {mode === 'login' && 'Welcome Back'}
                    {mode === 'signup' && 'Join the Community'}
                    {mode === 'forgot' && 'Reset Password'}
                </h2>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                <div className="social-login">
                    <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        <span>Continue with Google</span>
                    </button>
                </div>

                <div className="divider">
                    <span>or</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <Mail size={18} className="input-icon" />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div className="input-group">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Processing...' : (
                            mode === 'login' ? 'Log In' : (mode === 'signup' ? 'Sign Up' : 'Send Reset Link')
                        )}
                    </button>
                </form>

                <div className="modal-footer">
                    {mode === 'login' && (
                        <>
                            <p>Don't have an account? <span onClick={() => setMode('signup')}>Sign up</span></p>
                            <span className="forgot-link" onClick={() => setMode('forgot')}>Forgot password?</span>
                        </>
                    )}
                    {mode === 'signup' && (
                        <p>Already have an account? <span onClick={() => setMode('login')}>Log in</span></p>
                    )}
                    {mode === 'forgot' && (
                        <p>Remembered it? <span onClick={() => setMode('login')}>Log in</span></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
