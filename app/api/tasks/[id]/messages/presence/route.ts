import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { supabase } from "../../../../supabaseClient";
import { supabaseAdmin } from "../../../../../supabaseAdmin";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


// ====================================================
// GET CURRENT USER
// ====================================================

async function getCurrentUser() {

  const cookieStore = await cookies();

  const token =
    cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {

    const { payload } =
      await jwtVerify(
        token,
        secret
      );

    return {
      id: payload.id as string,
    };

  } catch {

    return null;

  }

}


// ====================================================
// POST PRESENCE
// Tell server user is viewing this task
// ====================================================

export async function POST(
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


    const user =
      await getCurrentUser();

    if (!user) {

      return NextResponse.json(
        {
          success: false,
          error: "Du må være innlogget.",
        },
        { status: 401 }
      );

    }


    // ------------------------------------------------
    // MAKE SURE USER CAN ACCESS TASK
    // ------------------------------------------------

    const {
      data: ticket,
      error: ticketError,
    } = await supabase
      .from("tasks")
      .select(
        "id, sender_id, receiver_id"
      )
      .eq("id", ticketId)
      .single();


    if (
      ticketError ||
      !ticket
    ) {

      return NextResponse.json(
        {
          success: false,
          error: "Saken ble ikke funnet.",
        },
        { status: 404 }
      );

    }


    const isUser =
      String(ticket.sender_id) ===
      String(user.id);

    const isEmployee =
      String(ticket.receiver_id) ===
      String(user.id);


    if (
      !isUser &&
      !isEmployee
    ) {

      return NextResponse.json(
        {
          success: false,
          error: "Du har ikke tilgang til denne saken.",
        },
        { status: 403 }
      );

    }


    // ------------------------------------------------
    // UPDATE PRESENCE
    // ------------------------------------------------

    const {
      error: presenceError,
    } = await supabaseAdmin
      .from("task_chat_presence")
      .upsert(
        {
          task_id: ticketId,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict:
            "task_id,user_id",
        }
      );


    if (presenceError) {

      console.error(
        "CHAT PRESENCE ERROR:",
        presenceError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke oppdatere chat-status.",
        },
        { status: 500 }
      );

    }


    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error(
      "CHAT PRESENCE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke oppdatere chat-status.",
      },
      { status: 500 }
    );

  }

}


// ====================================================
// DELETE PRESENCE
// User leaves the task
// ====================================================

export async function DELETE(
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


    const user =
      await getCurrentUser();

    if (!user) {

      return NextResponse.json(
        {
          success: false,
          error: "Du må være innlogget.",
        },
        { status: 401 }
      );

    }


    const {
      error,
    } = await supabaseAdmin
      .from("task_chat_presence")
      .delete()
      .eq(
        "task_id",
        ticketId
      )
      .eq(
        "user_id",
        user.id
      );


    if (error) {

      console.error(
        "CHAT PRESENCE DELETE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke avslutte chat-status.",
        },
        { status: 500 }
      );

    }


    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error(
      "CHAT PRESENCE DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke avslutte chat-status.",
      },
      { status: 500 }
    );

  }

}