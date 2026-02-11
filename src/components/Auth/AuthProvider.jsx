import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInAnonymously = async () => {
        // Specific logic for anonymous auth if enabled in Supabase
        // Or just verified email for posting.
        // For V1: "Public browsing without login."
        // "Posting/replying requires verified email."
        // So we invoke signInWithOtp or similar when needed?
        // or just expose signInWithOAuth if configured.

        // For now, exposing basic signIn method placeholder.
        return supabase.auth.signInWithOtp({ email: 'example@email.com' });
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInAnonymously }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
