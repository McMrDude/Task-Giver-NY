import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { supabase } from "../../../supabaseClient";
import { supabaseAdmin } from "../../../../supabaseAdmin";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


// ====================================================
// GET MESSAGES
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
        {
          status: 400,
        }
      );

    }


    // ------------------------------------------------
    // GET AUTH COOKIE
    // ------------------------------------------------

    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value;

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


    // ------------------------------------------------
    // VERIFY JWT
    // ------------------------------------------------

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


    // ------------------------------------------------
    // GET USER
    // ------------------------------------------------

    const userId = payload.id;

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


    const {
      data: currentUser,
      error: userError,
    } = await supabase
      .from("users")
      .select(
        "id, name, email, role"
      )
      .eq("id", userId)
      .single();


    if (
      userError ||
      !currentUser
    ) {

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


    // ------------------------------------------------
    // LOAD TICKET
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
        {
          status: 404,
        }
      );

    }


    // =================================================
    // AUTHORIZATION
    // =================================================

    // ADMIN

    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "employee" &&
      currentUser.role !== "user"
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


    // EMPLOYEE

    if (
      currentUser.role === "employee" &&
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


    // USER

    if (
      currentUser.role === "user" &&
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


    // ------------------------------------------------
    // LOAD MESSAGES
    // ------------------------------------------------

    const {
      data: messages,
      error: messageError,
    } = await supabase
      .from("task_messages")
      .select(`
        id,
        task_id,
        sender_id,
        content,
        created_at,

        sender:users!task_messages_sender_id_fkey (
          id,
          name,
          email,
          role
        )
      `)
      .eq(
        "task_id",
        ticketId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );


    if (messageError) {

      console.error(
        "Message lookup error:",
        messageError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke hente meldingene.",
        },
        {
          status: 500,
        }
      );

    }


    return NextResponse.json({
      success: true,
      data: messages || [],
    });


  } catch (error) {

    console.error(
      "GET /api/tasks/[id]/messages error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke hente meldingene.",
      },
      {
        status: 500,
      }
    );

  }

}


// ====================================================
// POST MESSAGE
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
        {
          status: 400,
        }
      );

    }


    // ------------------------------------------------
    // AUTH
    // ------------------------------------------------

    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value;

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


    const userId = payload.id;

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


    // ------------------------------------------------
    // GET CURRENT USER
    // ------------------------------------------------

    const {
      data: currentUser,
      error: userError,
    } = await supabase
      .from("users")
      .select(
        "id, name, email, role"
      )
      .eq("id", userId)
      .single();


    if (
      userError ||
      !currentUser
    ) {

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


    // ------------------------------------------------
    // LOAD TICKET
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
        {
          status: 404,
        }
      );

    }


    // =================================================
    // AUTHORIZATION
    // =================================================

    if (
      currentUser.role === "employee" &&
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


    if (
      currentUser.role === "user" &&
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


    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "employee" &&
      currentUser.role !== "user"
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


    // ------------------------------------------------
    // READ REQUEST BODY
    // ------------------------------------------------

    const body =
      await request.json();

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";


    if (!content) {

      return NextResponse.json(
        {
          success: false,
          error: "Meldingen kan ikke være tom.",
        },
        {
          status: 400,
        }
      );

    }


    // ------------------------------------------------
    // INSERT MESSAGE
    // ------------------------------------------------

    const {
      data: message,
      error: insertError,
    } = await supabase
      .from("task_messages")
      .insert({
        task_id: ticketId,
        sender_id: currentUser.id,
        content,
      })
      .select(`
        id,
        task_id,
        sender_id,
        content,
        created_at,

        sender:users!task_messages_sender_id_fkey (
          id,
          name,
          email,
          role
        )
      `)
      .single();


    if (insertError) {

      console.error(
        "Message insert error:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke sende meldingen.",
        },
        {
          status: 500,
        }
      );

    }

    // ------------------------------------------------
    // CREATE MESSAGE NOTIFICATION
    // ------------------------------------------------

    const notificationRecipient =
      currentUser.role === "employee"
        ? ticket.sender_id
        : ticket.receiver_id;


    if (notificationRecipient) {

      const { error: notificationError } =
        await supabaseAdmin
          .from("notifications")
          .insert({
            user_id: notificationRecipient,
            type: "message",
            title: "Ny melding",
            message: `${currentUser.name} har sendt deg en ny melding på en sak.`,
            task_id: ticketId,
            is_read: false,
          });


      if (notificationError) {

        console.error(
          "MESSAGE NOTIFICATION ERROR:",
          notificationError
        );

      }

    }

    await supabaseAdmin
    .channel(`ticket-messages-${ticketId}`)
    .send({
        type: "broadcast",
        event: "new-message",
        payload: {
            messageId: message.id,
        },
    });


    return NextResponse.json(
      {
        success: true,
        data: message,
      },
      {
        status: 201,
      }
    );


  } catch (error) {

    console.error(
      "POST /api/tasks/[id]/messages error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke sende meldingen.",
      },
      {
        status: 500,
      }
    );

  }

}