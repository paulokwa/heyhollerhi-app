import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing. Utilizing mock client.");
}

// Mock client builder for safe fallbacks
const createMockClient = () => {
    const chainable = () => ({
        select: chainable,
        eq: chainable,
        neq: chainable,
        gt: chainable,
        lt: chainable,
        gte: chainable,
        lte: chainable,
        in: chainable,
        is: chainable,
        like: chainable,
        ilike: chainable,
        contains: chainable,
        range: chainable,
        order: chainable,
        limit: chainable,
        single: chainable,
        maybeSingle: chainable,
        insert: chainable,
        update: chainable,
        upsert: chainable,
        delete: chainable,
        then: (resolve) => resolve({ data: [], error: null }) // Promise-like behavior
    });

    return {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithOtp: async () => ({ data: null, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
        from: (table) => chainable()
    };
};

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : createMockClient();
