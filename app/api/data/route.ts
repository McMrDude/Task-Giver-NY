import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client handles the connection to your PostgreSQL database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const dbConnectionString = process.env.DATABASE_URL; 

// Dette er ren Node.js som kjører på server-siden (backend)
export async function GET() {

    
    
    const backendData = {
        tittel: "Hilsen fra Node.js!",
        status: "Suksess",
        tidspunkt: new Date().toLocaleTimeString('nb-NO'),
        db_connected: dbConnectionString ? "Yes" : "No"
    };

    return NextResponse.json(backendData);
}