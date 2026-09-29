import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurationError = !supabaseUrl || !supabaseAnonKey
  ? 'Supabase não está configurado neste ambiente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  : null;

// Keep the module loadable so a missing deployment variable results in a visible
// configuration message instead of a completely blank page.
const clientUrl = supabaseUrl || 'https://missing-supabase-config.invalid';
const clientKey = supabaseAnonKey || 'missing-supabase-anon-key';

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'igreja-auth-token-v2',
  },
});

export default supabase;
