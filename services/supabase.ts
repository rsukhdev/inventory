
import { createClient } from '@supabase/supabase-js';

// Priority 1: Check environment variables
// Priority 2: Check localStorage (for user-configured keys)
const getKeys = () => {
  const envUrl = (process.env as any).SUPABASE_URL;
  const envKey = (process.env as any).SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) return { url: envUrl, key: envKey };
  
  const localUrl = localStorage.getItem('texflow_supabase_url');
  const localKey = localStorage.getItem('texflow_supabase_key');
  
  if (localUrl && localKey) return { url: localUrl, key: localKey };
  
  return null;
};

const keys = getKeys();

export const supabase = keys 
  ? createClient(keys.url, keys.key) 
  : null;

export const DB_TABLES = {
  FABRICS: 'fabrics',
  CHALLANS: 'challans',
  GROUPS: 'groups'
};

/**
 * Saves keys to localStorage and reloads to initialize the client
 */
export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('texflow_supabase_url', url);
  localStorage.setItem('texflow_supabase_key', key);
  window.location.reload();
};

/**
 * Clears keys and reloads
 */
export const disconnectSupabase = () => {
  localStorage.removeItem('texflow_supabase_url');
  localStorage.removeItem('texflow_supabase_key');
  window.location.reload();
};
