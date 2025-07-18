import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xofrqvbzspbzmwmfijwn.supabase.co';  // ← paste yours
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZnJxdmJ6c3Biem13bWZpanduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTI1MTIsImV4cCI6MjA2ODA2ODUxMn0.LKxQqtHd1oA-utaNONNSRPP6JLUhRqM9oQByso3dxRk';               // ← paste yours

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    