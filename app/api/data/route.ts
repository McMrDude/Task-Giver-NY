// src/app/api/data/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../supabaseClient';

// Handles GET requests for ANY table (e.g., /api/data?table=users&select=id,email)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') || 'messages';
  const columns = searchParams.get('select') || '*'; // Default to fetching all columns

  const { data, error } = await supabase.from(table).select(columns);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ data });
}

// Handles POST requests for ANY table with ANY columns
export async function POST(request: Request) {
  const { table, insertData } = await request.json(); 
  // Expecting frontend payload format: { table: 'orders', insertData: { price: 20, item: 'Book' } }

  const { data, error } = await supabase.from(table).insert([insertData]).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, data });
}
