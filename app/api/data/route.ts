import { NextResponse } from 'next/server';

// Dette er ren Node.js som kjører på server-siden (backend)
export async function GET() {
  const backendData = {
    tittel: "Hilsen fra Node.js!",
    status: "Suksess",
    tidspunkt: new Date().toLocaleTimeString('nb-NO')
  };

  return NextResponse.json(backendData);
}