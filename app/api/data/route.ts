import { NextResponse } from 'next/server';
import { supabase } from '../supabaseClient';

// 1. GET METHOD: Dynamic reading from ANY table via query parameters
// Example: /api/data?table=tasks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json({ success: false, error: "Missing 'table' query parameter" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. POST METHOD: Dynamic inserting into ANY table via JSON body parameters
// Expected Payload: { table: 'tasks', insertData: { ... } }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, insertData } = body;

    if (!table || !insertData) {
      return NextResponse.json({ success: false, error: "Missing 'table' or 'insertData' in request body" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(table)
      .insert([insertData])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
