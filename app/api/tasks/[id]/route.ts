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
            error:
              "Du har ikke tilgang til denne saken.",
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
            error:
              "Denne saken er ikke tildelt deg.",
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



// ====================================================
// PATCH SINGLE TICKET
// ADMIN ONLY
// ====================================================

export async function PATCH(
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

    const role = String(payload.role);


    // ------------------------------------------------
    // ADMIN ONLY
    // ------------------------------------------------

    if (role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Du har ikke tilgang til å endre denne saken.",
        },
        { status: 403 }
      );
    }


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
    // READ REQUEST BODY
    // ------------------------------------------------

    const body = await request.json();

    const {
      receiver_id,
      status,
      priority,
      due_date,
    } = body;


    // ------------------------------------------------
    // BUILD UPDATE
    // ------------------------------------------------

    const updateData: Record<string, any> = {};


    // ------------------------------------------------
    // ASSIGN EMPLOYEE
    // ------------------------------------------------

    if (
      receiver_id !== undefined
    ) {

      if (
        receiver_id === null ||
        receiver_id === ""
      ) {
        updateData.receiver_id = null;
      } else {
        updateData.receiver_id =
          String(receiver_id);
      }

    }


    // ------------------------------------------------
    // STATUS
    // ------------------------------------------------

    if (
      status !== undefined
    ) {
      updateData.status = status;
    }


    // ------------------------------------------------
    // PRIORITY
    // ------------------------------------------------

    if (
      priority !== undefined
    ) {
      updateData.priority = priority;
    }


    // ------------------------------------------------
    // DUE DATE
    // ------------------------------------------------

    if (
      due_date !== undefined
    ) {
      updateData.due_date =
        due_date === ""
          ? null
          : due_date;
    }


    // ------------------------------------------------
    // NOTHING TO UPDATE
    // ------------------------------------------------

    if (
      Object.keys(updateData).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Ingen endringer ble sendt.",
        },
        { status: 400 }
      );
    }


    // ------------------------------------------------
    // UPDATE DATABASE
    // ------------------------------------------------

    const {
      data: updatedTicket,
      error,
    } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", ticketId)
      .select("*")
      .single();


    // ------------------------------------------------
    // DATABASE ERROR
    // ------------------------------------------------

    if (error) {

      console.error(
        "UPDATE TICKET ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke oppdatere saken.",
        },
        { status: 500 }
      );
    }


    // ------------------------------------------------
    // RETURN UPDATED TICKET
    // ------------------------------------------------

    return NextResponse.json({
      success: true,
      data: updatedTicket,
    });

  } catch (error) {

    console.error(
      "PATCH TICKET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Kunne ikke oppdatere saken.",
      },
      { status: 500 }
    );
  }
}