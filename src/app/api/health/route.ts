import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
        // Pinging the 'profiles' table to ensure connection and SQL injection were successful
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        
        if (error) {
            return NextResponse.json({ status: 'db_error', message: error.message }, { status: 500 });
        }
        
        return NextResponse.json({ status: 'success', message: 'Conexión a Supabase estable y validada. Tablas inyectadas correctamente.' });
    } catch (err: any) {
        return NextResponse.json({ status: 'fatal_error', message: err.message }, { status: 500 });
    }
}
