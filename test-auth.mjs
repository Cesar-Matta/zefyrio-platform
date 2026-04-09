import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("=== AUDITORÍA DE AUTENTICACIÓN Y BASE DE DATOS ===");
    
    // Check if profiles are being created by the SQL Trigger
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    
    if (pErr) {
        console.error("❌ ERROR LEYENDO PERFILES:", pErr.message);
    } else {
        console.log(`✅ TABLA 'profiles' OK. Encontrados: ${profiles.length}`);
        if (profiles.length > 0) {
            console.log("Muestra del último piloto registrado:", profiles[profiles.length - 1]);
        } else {
            console.log("⚠️ No hay usuarios en la tabla 'profiles'. El Trigger SQL no ha sido disparado por un Login aún.");
        }
    }
}
run();
