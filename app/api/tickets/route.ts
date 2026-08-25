import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


// ----------------------------------------------------
// GET
// ----------------------------------------------------

export async function GET() {
  try {

    // Get authentication cookie
    const cookieStore = await cookies();

    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være logget inn.",
        },
        { status: 401 }
      );
    }


    // Verify JWT
    const { payload } = await jwtVerify(
      token,
      secret
    );


    // Make sure we have a user ID
    if (!payload.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig innlogging.",
        },
        { status: 401 }
      );
    }


    // Get tickets created by this user
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("sender_id", payload.id)
      .order("created_at", {
        ascending: false,
      });


    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke hente støttesaker.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Ugyldig innlogging.",
      },
      { status: 401 }
    );

  }
}



// ----------------------------------------------------
// POST
// ----------------------------------------------------

export async function POST(request: Request) {

  try {

    // Get authentication cookie
    const cookieStore = await cookies();

    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være logget inn for å opprette en støttesak.",
        },
        { status: 401 }
      );
    }


    // Verify JWT
    const { payload } = await jwtVerify(
      token,
      secret
    );


    // Make sure we have a user ID
    if (!payload.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig innlogging.",
        },
        { status: 401 }
      );
    }


    // Read request body
    const body = await request.json();

    const {
      content,
      category,
      subcategory,
      priority,
      due_date,
    } = body;


    // Basic validation
    if (
      !content ||
      !category ||
      !subcategory ||
      !priority
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Alle nødvendige felt må fylles ut.",
        },
        { status: 400 }
      );
    }


    // Create ticket
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          sender_id: payload.id,
          receiver_id: null,

          content,
          category,
          subcategory,
          priority,

          due_date: due_date || null,

          status: "not_started",
        },
      ])
      .select()
      .single();


    if (error) {

      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke opprette støttesaken.",
        },
        { status: 500 }
      );

    }


    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "En uventet feil oppstod.",
      },
      { status: 500 }
    );

  }

}