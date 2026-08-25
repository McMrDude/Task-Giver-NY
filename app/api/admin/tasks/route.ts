import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    return {
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}


// ====================================================
// GET
// ====================================================

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være logget inn.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Du har ikke tilgang til adminpanelet.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("ADMIN TASK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke hente saker.",
      },
      { status: 500 }
    );
  }
}


// ====================================================
// PATCH
// ====================================================

export async function PATCH(
  request: Request
) {
  try {

    // ------------------------------------------------
    // Check logged-in user
    // ------------------------------------------------

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være logget inn.",
        },
        { status: 401 }
      );
    }


    // ------------------------------------------------
    // Check admin
    // ------------------------------------------------

    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Du har ikke tilgang til adminpanelet.",
        },
        { status: 403 }
      );
    }


    // ------------------------------------------------
    // Read request body
    // ------------------------------------------------

    const body = await request.json();

    const {
      id,
      status,
      receiver_id,
      priority,
      due_date,
    } = body;


    // ------------------------------------------------
    // Validate ID
    // ------------------------------------------------

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Mangler sak-ID.",
        },
        { status: 400 }
      );
    }


    // ------------------------------------------------
    // Build update object
    // ------------------------------------------------

    const updates: Record<string, unknown> = {};


    if (status !== undefined) {
      updates.status = status;
    }


    if (receiver_id !== undefined) {
      updates.receiver_id = receiver_id;
    }


    if (priority !== undefined) {
      updates.priority = priority;
    }


    if (due_date !== undefined) {
      updates.due_date = due_date;
    }


    // ------------------------------------------------
    // Make sure something is being changed
    // ------------------------------------------------

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Ingen endringer ble sendt.",
        },
        { status: 400 }
      );
    }


    // ------------------------------------------------
    // Update task
    // ------------------------------------------------

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();


    if (error) {
      console.error(
        "SUPABASE UPDATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke oppdatere saken.",
        },
        { status: 500 }
      );
    }


    // ------------------------------------------------
    // Success
    // ------------------------------------------------

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {

    console.error(
      "ADMIN TASK PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke oppdatere saken.",
      },
      { status: 500 }
    );

  }
}