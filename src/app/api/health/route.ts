import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Ping 'profiles' to verify connection.
        const { error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
            return NextResponse.json({ status: 'db_error', message: error.message }, { status: 500 });
        }

        return NextResponse.json({ status: 'success', message: 'Conexión a Supabase estable y validada.' });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ status: 'fatal_error', message }, { status: 500 });
    }
}
