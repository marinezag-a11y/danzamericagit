
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('hero_banners').select('*').limit(1);
  if (error) {
    console.log('TABLE_NOT_FOUND', error.message);
  } else {
    console.log('TABLE_EXISTS', data);
  }
}
test();
