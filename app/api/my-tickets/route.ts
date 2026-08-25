import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function GET() {
  try {
    // ------------------------------------------------
    // Get logged-in user
    // ------------------------------------------------

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

    // ------------------------------------------------
    // Verify JWT
    // ------------------------------------------------

    const { payload } = await jwtVerify(
      token,
      secret
    );

    if (!payload.id || !payload.role) {
      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig innlogging.",
        },
        { status: 401 }
      );
    }

    const userId = String(payload.id);
    const role = String(payload.role);

    // ------------------------------------------------
    // USER
    // Users see tickets they created
    // ------------------------------------------------

    if (role === "user") {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("sender_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);

        return NextResponse.json(
          {
            success: false,
            error: "Kunne ikke hente dine saker.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    // ------------------------------------------------
    // EMPLOYEE
    // Employees see tickets assigned to them
    // ------------------------------------------------

    if (role === "employee") {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("receiver_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);

        return NextResponse.json(
          {
            success: false,
            error: "Kunne ikke hente dine tildelte saker.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    // ------------------------------------------------
    // ADMIN
    // ------------------------------------------------

    if (role === "admin") {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);

        return NextResponse.json(
          {
            success: false,
            error: "Kunne ikke hente saker.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    // ------------------------------------------------
    // Unknown role
    // ------------------------------------------------

    return NextResponse.json(
      {
        success: false,
        error: "Ugyldig brukerrolle.",
      },
      { status: 403 }
    );

  } catch (error) {
    console.error("MY TICKETS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Ugyldig innlogging.",
      },
      { status: 401 }
    );
  }
}