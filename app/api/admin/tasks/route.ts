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
    // GET CURRENT TASK
    // ------------------------------------------------
    //
    // We need the old receiver_id so we can determine
    // whether a new employee was actually assigned.
    //

    const {
      data: currentTask,
      error: currentTaskError,
    } = await supabase
      .from("tasks")
      .select("id, receiver_id, sender_id, status")
      .eq("id", id)
      .single();


    if (
      currentTaskError ||
      !currentTask
    ) {

      console.error(
        "CURRENT TASK LOOKUP ERROR:",
        currentTaskError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Saken ble ikke funnet.",
        },
        { status: 404 }
      );

    }


    const oldReceiverId =
      currentTask.receiver_id;


    // ------------------------------------------------
    // BUILD UPDATE OBJECT
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
    // MAKE SURE SOMETHING IS BEING CHANGED
    // ------------------------------------------------

    if (
      Object.keys(updates).length === 0
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
    // CHECK WHETHER A NEW EMPLOYEE IS BEING ASSIGNED
    // ------------------------------------------------

    const assigningNewEmployee =
      receiver_id !== undefined &&
      receiver_id !== null &&
      String(receiver_id) !==
        String(oldReceiverId);


    // ------------------------------------------------
    // UPDATE TASK
    // ------------------------------------------------

    const {
      data,
      error,
    } = await supabase
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

    // ==================================================
    // CREATE USER NOTIFICATION WHEN TASK IS COMPLETED
    // ==================================================

    const completingTask =
      status === "completed" &&
      currentTask.status !== "completed";


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


    // ==================================================
    // CREATE EMPLOYEE NOTIFICATION
    // ==================================================

    if (assigningNewEmployee) {

      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id: receiver_id,
          type: "task_assigned",
          task_id: id,
          message:
            `Du har fått tildelt sak #${id}.`,
          is_read: false,
        });


      if (notificationError) {

        console.error(
          "TASK ASSIGNMENT NOTIFICATION ERROR:",
          notificationError
        );

        // The task was successfully updated,
        // so we don't undo the update here.
        //
        // The error is logged so it can be
        // investigated if notification creation fails.

      }

    }


    // ------------------------------------------------
    // SUCCESS
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