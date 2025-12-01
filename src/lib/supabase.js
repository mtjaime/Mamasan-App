import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://txfgrlupxnusegrkjrjo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZmdybHVweG51c2VncmtqcmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDQzNjAsImV4cCI6MjA4MDEyMDM2MH0.EeIDUXQZq-oTV2u3U5iFeArpGwLBc0ReVpRd1WG_DvU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
