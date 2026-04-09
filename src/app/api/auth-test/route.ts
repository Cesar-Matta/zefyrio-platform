import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: profiles, error } = await supabase.from('profiles').select('*');
    
    return NextResponse.json({
        success: !error,
        count: profiles ? profiles.length : 0,
        profiles,
        error: error ? error.message : null
    });
}
