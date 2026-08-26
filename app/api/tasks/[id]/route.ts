import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { supabase } from "../../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


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

    // --------------------------------------------------
    // GET ID FROM URL
    // --------------------------------------------------

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


    // --------------------------------------------------
    // GET AUTH COOKIE
    // --------------------------------------------------

    const cookieStore = await cookies();

    const token =
      cookieStore.get("token")?.value;


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


    // --------------------------------------------------
    // VERIFY JWT
    // --------------------------------------------------

    let payload;

    try {

      const verified =
        await jwtVerify(
          token,
          secret
        );

      payload = verified.payload;

    } catch {

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


    // --------------------------------------------------
    // GET USER ID FROM JWT
    // --------------------------------------------------

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


    // --------------------------------------------------
    // GET USER
    // --------------------------------------------------

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


    if (
      userError ||
      !currentUser
    ) {

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


    // --------------------------------------------------
    // LOAD TICKET
    // --------------------------------------------------

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


    if (
      ticketError ||
      !ticket
    ) {

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
    //
    // Admins can view every ticket.
    //

    if (
      currentUser.role === "admin"
    ) {

      return NextResponse.json({
        success: true,
        data: ticket,
      });

    }


    // --------------------------------------------------
    // EMPLOYEE
    // --------------------------------------------------
    //
    // Employees can view tickets assigned to them.
    //

    if (
      currentUser.role === "employee"
    ) {

      if (
        String(ticket.receiver_id) !==
        String(currentUser.id)
      ) {

        return NextResponse.json(
          {
            success: false,
            error: "Du har ikke tilgang til denne saken.",
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
    //
    // A normal user may ONLY view tickets that
    // they themselves created.
    //

    if (
      String(ticket.sender_id) !==
      String(currentUser.id)
    ) {

      return NextResponse.json(
        {
          success: false,
          error: "Du har ikke tilgang til denne saken.",
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