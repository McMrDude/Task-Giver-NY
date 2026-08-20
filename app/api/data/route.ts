import { NextResponse } from 'next/server';

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