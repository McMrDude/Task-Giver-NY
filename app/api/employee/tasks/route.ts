import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../../supabaseClient";

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
      await jwtVerify(token, secret);

    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
    };

  } catch {
    return null;
  }
}


// ====================================================
// GET
// Get tickets assigned to the employee
// ====================================================

export async function GET() {

  try {

    const user = await getCurrentUser();

    // ----------------------------------------------
    // NOT LOGGED IN
    // ----------------------------------------------

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være logget inn.",
        },
        { status: 401 }
      );
    }


    // ----------------------------------------------
    // MAKE SURE USER IS EMPLOYEE
    // ----------------------------------------------

    if (user.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          error: "Du har ikke tilgang til denne siden.",
        },
        { status: 403 }
      );
    }


    // ----------------------------------------------
    // GET ASSIGNED TICKETS
    // ----------------------------------------------

    const { data, error } =
      await supabase
        .from("tasks")
        .select(`
          *,
          sender:users!tasks_sender_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq("receiver_id", user.id)
        .order("created_at", {
          ascending: false,
        });


    if (error) {

      console.error(
        "EMPLOYEE GET TASKS ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke hente tildelte saker.",
        },
        { status: 500 }
      );

    }


    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (error) {

    console.error(
      "EMPLOYEE TASK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "En uventet feil oppstod.",
      },
      { status: 500 }
    );

  }

}


// ====================================================
// PATCH
// Employee updates their own assigned ticket
// ====================================================

export async function PATCH(
  request: Request
) {

  try {

    const user = await getCurrentUser();

    // ----------------------------------------------
    // NOT LOGGED IN
    // ----------------------------------------------

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være logget inn.",
        },
        { status: 401 }
      );
    }


    // ----------------------------------------------
    // MAKE SURE USER IS EMPLOYEE
    // ----------------------------------------------

    if (user.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bare ansatte kan oppdatere disse sakene.",
        },
        { status: 403 }
      );
    }


    // ----------------------------------------------
    // READ REQUEST
    // ----------------------------------------------

    const body = await request.json();

    const {
      id,
      status,
    } = body;


    // ----------------------------------------------
    // VALIDATE ID
    // ----------------------------------------------

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Mangler saks-ID.",
        },
        { status: 400 }
      );
    }


    // ----------------------------------------------
    // VALIDATE STATUS
    // ----------------------------------------------

    const allowedStatuses = [
      "new",
      "not_started",
      "started",
      "completed"
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig status.",
        },
        { status: 400 }
      );
    }


    // ----------------------------------------------
    // GET CURRENT TASK
    // ----------------------------------------------
    //
    // We need the current status and sender_id
    // before changing anything.
    //

    const {
      data: currentTask,
      error: currentTaskError,
    } = await supabase
      .from("tasks")
      .select(
        "id, sender_id, status"
      )
      .eq("id", id)
      .eq("receiver_id", user.id)
      .single();


    if (
      currentTaskError ||
      !currentTask
    ) {

      console.error(
        "EMPLOYEE CURRENT TASK ERROR:",
        currentTaskError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke finne saken. Kontroller at saken er tildelt til deg.",
        },
        { status: 404 }
      );

    }


    // ----------------------------------------------
    // CHECK WHETHER TASK IS BEING COMPLETED
    // ----------------------------------------------

    const completingTask =
      status === "completed" &&
      currentTask.status !== "completed";


    // ----------------------------------------------
    // UPDATE TASK
    // ----------------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("tasks")
      .update({
        status,
      })
      .eq("id", id)
      .eq("receiver_id", user.id)
      .select()
      .single();


    // ----------------------------------------------
    // UPDATE FAILED
    // ----------------------------------------------

    if (error) {

      console.error(
        "EMPLOYEE UPDATE TASK ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke oppdatere saken. Kontroller at saken er tildelt til deg.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // CREATE USER NOTIFICATION
    // ==================================================

    if (
      completingTask &&
      currentTask.sender_id
    ) {

      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id: currentTask.sender_id,
          type: "task_completed",
          task_id: id,
          message:
            `Sak #${id} er ferdig behandlet.`,
          is_read: false,
        });


      if (notificationError) {

        console.error(
          "TASK COMPLETION NOTIFICATION ERROR:",
          notificationError
        );

      }

    }


    // ----------------------------------------------
    // SUCCESS
    // ----------------------------------------------

    return NextResponse.json({
      success: true,
      data,
    });


  } catch (error) {

    console.error(
      "EMPLOYEE PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "En uventet feil oppstod.",
      },
      { status: 500 }
    );

  }

}