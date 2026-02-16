import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mustCompleteProfile, setMustCompleteProfile] = useState(false);

    // Fetch or Create Profile
    const ensureProfile = async (userId, email) => {
        try {
            // 1. Try to get existing profile
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!data && error) {
                // If error is NOT "Row not found", log it
                if (error.code !== 'PGRST116') {
                    console.error("Profile fetch error:", error);
                }
            }

            if (data) {
                console.log("Profile loaded:", data.display_name);
                setProfile(data);
                setMustCompleteProfile(false);
            } else {
                // 2. Create new profile if missing
                console.log("Creating new profile for:", userId);
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

                if (createError) {
                    // If creation failed but it might already verify existence (race condition), try select again
                    console.error("Error creating profile:", createError);
                } else {
                    setProfile(created);
                    setMustCompleteProfile(true);
                }
            }
        } catch (e) {
            console.error("Profile check failed:", e);
        }
    };

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await ensureProfile(session.user.id, session.user.email);
            }
            setLoading(false);
        };

        getSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event);
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
                redirectTo: `${window.location.origin}/`
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
