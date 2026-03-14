import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vfiuxmknukkksjntrjiy.supabase.co';
const supabaseKey = 'sb_publishable_7knor9JJmorL9MDxPzIrNQ_Q9k5Mv2P';

export const supabase = createClient(supabaseUrl, supabaseKey);
