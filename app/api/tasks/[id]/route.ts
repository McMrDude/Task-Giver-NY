import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ------------------------------------------------
    // GET LOGGED-IN USER
    // ------------------------------------------------

    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value;

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
    // VERIFY JWT
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
    // GET TICKET ID
    // ------------------------------------------------

    const { id } = await params;

    const ticketId = Number(id);

    if (!Number.isInteger(ticketId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig saksnummer.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // LOAD TICKET
    // ------------------------------------------------

    const { data: ticket, error } =
      await supabase
        .from("tasks")
        .select("*")
        .eq("id", ticketId)
        .single();

    if (error || !ticket) {
      return NextResponse.json(
        {
          success: false,
          error: "Saken ble ikke funnet.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------
    // PERMISSION CHECK
    // ------------------------------------------------

    if (role === "user") {
      if (
        String(ticket.sender_id) !== userId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Du har ikke tilgang til denne saken.",
          },
          { status: 403 }
        );
      }
    }

    if (role === "employee") {
      if (
        String(ticket.receiver_id) !== userId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Denne saken er ikke tildelt deg.",
          },
          { status: 403 }
        );
      }
    }

    // Admin can access everything.

    // ------------------------------------------------
    // RETURN
    // ------------------------------------------------

    return NextResponse.json({
      success: true,
      data: ticket,
    });

  } catch (error) {
    console.error(
      "GET TICKET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke hente saken.",
      },
      { status: 500 }
    );
  }
}