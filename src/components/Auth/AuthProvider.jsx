import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfileState] = useState(() => {
        try {
            const cached = localStorage.getItem('user_profile');
            return cached ? JSON.parse(cached) : null;
        } catch (e) { return null; }
    });

    const setProfile = (data) => {
        setProfileState(data);
        if (data) {
            localStorage.setItem('user_profile', JSON.stringify(data));
        } else {
            localStorage.removeItem('user_profile');
        }
    };

    const [loading, setLoading] = useState(true);
    const [mustCompleteProfile, setMustCompleteProfile] = useState(false);

    // Fetch or Create Profile
    const ensureProfile = async (userId, email) => {
        console.log("ensureProfile called for:", userId);

        // Timeout helper - Reduced to 2s to fail faster if needed
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timed out')), 2000));

        try {
            // 1. Try to get existing profile
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            let { data, error } = await Promise.race([fetchPromise, timeout]);

            if (error) console.error("Profile select error:", error);
            if (data) console.log("Profile found (Network):", data.display_name);

            if (data) {
                setProfile(data); // Updates state & local storage
                setMustCompleteProfile(false);
                return;
            }

            // If network timed out or failed, but we have a cached profile matching the ID, stick with it
            if (!data && profile && profile.id === userId) {
                console.log("Network search failed, keeping cached profile.");
                return;
            }

            // 2. Create new profile if missing
            console.log("Profile missing, attempting create...");
            const newProfile = {
                id: userId,
                display_name: (await import('../../utils/nameGenerator')).generateName(),
                avatar_seed: crypto.randomUUID(),
                bio: ''
            };

            const { data: created, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

            if (created) {
                console.log("Profile created successfully:", created);
                setProfile(created);
                setMustCompleteProfile(true);
            } else if (createError) {
                console.error("Profile create error:", createError);

                // 3. Robustness: If duplicate key error (23505), it means it exists! Fetch it.
                if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
                    console.log("Duplicate detected (race condition), retrying select...");
                    const { data: retryData, error: retryError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (retryData) {
                        console.log("Retry select success:", retryData);
                        setProfile(retryData);
                        setMustCompleteProfile(false);
                    } else {
                        console.error("Retry select failed:", retryError);
                    }
                }
            }
        } catch (e) {
            console.error("Profile logic exception:", e);
        }
    };

    useEffect(() => {
        // Listen for changes
        // We rely SOLELY on onAuthStateChange to handle initial load and updates
        // to avoid race conditions with manual getSession() calls.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event);

            if (event === 'PASSWORD_RECOVERY') {
                // Redirect to update password page
                window.location.hash = ''; // Clear the hash
                window.location.pathname = '/update-password';
            }

            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                // Only fetch if profile is missing or user changed
                if (!profile || profile.id !== currentUser.id) {
                    await ensureProfile(currentUser.id, currentUser.email);
                }
            } else {
                setProfile(null);
                setMustCompleteProfile(false);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    };

    const signInWithEmail = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const signUpWithEmail = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };


    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("SignOut error:", error);
        // Force local state clear immediately
        setProfile(null);
        setUser(null);
        setSession(null);
    };

    const resetPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
    };

    const updateProfile = async (updates) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;
        setProfile(data);
        return data;
    };

    const completeProfile = () => {
        setMustCompleteProfile(false);
    };

    const value = {
        user,
        session,
        profile,
        loading,
        mustCompleteProfile,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        updateProfile,
        completeProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
