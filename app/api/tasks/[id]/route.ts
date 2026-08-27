import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { supabase } from "../../supabaseClient";

const secretValue = process.env.AUTH_SECRET;

if (!secretValue) {
  throw new Error("AUTH_SECRET is not configured.");
}

const secret = new TextEncoder().encode(secretValue);


// ====================================================
// GET SINGLE TICKET
// ====================================================

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    // ==================================================
    // GET TICKET ID
    // ==================================================

    const { id } = await params;

    const ticketId = Number(id);

    if (!Number.isInteger(ticketId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig saksnummer.",
        },
        {
          status: 400,
        }
      );
    }


    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være innlogget.",
        },
        {
          status: 401,
        }
      );
    }


    // ==================================================
    // VERIFY JWT
    // ==================================================

    let payload;

    try {

      const verified = await jwtVerify(
        token,
        secret
      );

      payload = verified.payload;

    } catch (error) {

      console.error(
        "JWT verification error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig innlogging.",
        },
        {
          status: 401,
        }
      );
    }


    // ==================================================
    // GET USER ID
    // ==================================================

    const userId =
      payload.userId ??
      payload.user_id ??
      payload.sub;

    if (!userId) {

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke finne brukeren.",
        },
        {
          status: 401,
        }
      );
    }


    // ==================================================
    // LOAD CURRENT USER
    // ==================================================

    const {
      data: currentUser,
      error: userError,
    } = await supabase
      .from("users")
      .select(
        "id, name, email, role"
      )
      .eq(
        "id",
        userId
      )
      .single();


    if (userError || !currentUser) {

      console.error(
        "User lookup error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Brukeren ble ikke funnet.",
        },
        {
          status: 401,
        }
      );
    }


    // ==================================================
    // LOAD TICKET
    // ==================================================

    const {
      data: ticket,
      error: ticketError,
    } = await supabase
      .from("tasks")
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        category,
        subcategory,
        status,
        priority,
        due_date,
        created_at,

        sender:users!tasks_sender_id_fkey (
          id,
          name,
          email
        ),

        receiver:users!tasks_receiver_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq(
        "id",
        ticketId
      )
      .single();


    if (ticketError || !ticket) {

      console.error(
        "Ticket lookup error:",
        ticketError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Saken ble ikke funnet.",
        },
        {
          status: 404,
        }
      );
    }


    // ==================================================
    // AUTHORIZATION
    // ==================================================

    // --------------------------------------------------
    // ADMIN
    // --------------------------------------------------

    if (currentUser.role === "admin") {

      return NextResponse.json({
        success: true,
        data: ticket,
      });
    }


    // --------------------------------------------------
    // EMPLOYEE
    // --------------------------------------------------

    if (currentUser.role === "employee") {

      const assignedToCurrentUser =
        String(ticket.receiver_id) ===
        String(currentUser.id);


      if (!assignedToCurrentUser) {

        return NextResponse.json(
          {
            success: false,
            error:
              "Du har ikke tilgang til denne saken.",
          },
          {
            status: 403,
          }
        );
      }


      return NextResponse.json({
        success: true,
        data: ticket,
      });
    }


    // --------------------------------------------------
    // NORMAL USER
    // --------------------------------------------------

    const createdByCurrentUser =
      String(ticket.sender_id) ===
      String(currentUser.id);


    if (!createdByCurrentUser) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Du har ikke tilgang til denne saken.",
        },
        {
          status: 403,
        }
      );
    }


    // --------------------------------------------------
    // USER IS ALLOWED
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      data: ticket,
    });

  } catch (error) {

    console.error(
      "GET /api/tasks/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke hente saken.",
      },
      {
        status: 500,
      }
    );
  }
}