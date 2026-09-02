import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import emailjs from "@emailjs/browser";
import { supabase } from "../../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


// ====================================================
// EMAILJS
// ====================================================

async function sendTaskAssignmentEmail({
  employeeEmail,
  employeeName,
  taskId,
  taskCategory,
  taskPriority,
  dueDate,
  taskContent,
  assignedBy,
}: {
  employeeEmail: string;
  employeeName: string;
  taskId: string | number;
  taskCategory?: string | null;
  taskPriority?: string | null;
  dueDate?: string | null;
  taskContent?: string | null;
  assignedBy?: string | null;
}) {

  const serviceId =
    process.env.EMAILJS_SERVICE_ID;

  const templateId =
    process.env.EMAILJS_TEMPLATE_ID_TASK_ASSIGNED;

  const publicKey =
    process.env.EMAILJS_PUBLIC_KEY;

  const privateKey =
    process.env.EMAILJS_PRIVATE_KEY;


  if (
    !serviceId ||
    !templateId ||
    !publicKey ||
    !privateKey
  ) {
    throw new Error(
      "EmailJS environment variables are missing."
    );
  }


  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email: employeeEmail,

      to_name: employeeName,

      task_id: String(taskId),

      task_category:
        taskCategory ?? "Ikke spesifisert",

      task_priority:
        taskPriority ?? "Ikke spesifisert",

      due_date:
        dueDate
          ? new Date(dueDate).toLocaleDateString("nb-NO")
          : "Ingen frist",

      task_content:
        taskContent ?? "",

      assigned_by:
        assignedBy ?? "IT Support",
    },
    {
      publicKey,
      privateKey,
    }
  );
}


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

    const user =
      await getCurrentUser();


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
          error:
            "Du har ikke tilgang til adminpanelet.",
        },
        { status: 403 }
      );

    }


    const {
      data,
      error,
    } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", {
        ascending: false,
      });


    if (error) {

      console.error(error);

      throw error;

    }


    return NextResponse.json({
      success: true,
      data,
    });


  } catch (error) {

    console.error(
      "ADMIN TASK ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        error:
          "Kunne ikke hente saker.",
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

    const user =
      await getCurrentUser();


    if (!user) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Du må være logget inn.",
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
          error:
            "Du har ikke tilgang til adminpanelet.",
        },
        { status: 403 }
      );

    }


    // ------------------------------------------------
    // Read request body
    // ------------------------------------------------

    const body =
      await request.json();


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
          error:
            "Mangler sak-ID.",
        },
        { status: 400 }
      );

    }


    // ------------------------------------------------
    // GET CURRENT TASK
    // ------------------------------------------------

    const {
      data: currentTask,
      error: currentTaskError,
    } = await supabase
      .from("tasks")
      .select(
        "id, receiver_id, sender_id, status"
      )
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
          error:
            "Saken ble ikke funnet.",
        },
        { status: 404 }
      );

    }


    const oldReceiverId =
      currentTask.receiver_id;


    // ------------------------------------------------
    // BUILD UPDATE OBJECT
    // ------------------------------------------------

    const updates:
      Record<string, unknown> = {};


    if (status !== undefined) {
      updates.status = status;
    }


    if (receiver_id !== undefined) {
      updates.receiver_id =
        receiver_id;
    }


    if (priority !== undefined) {
      updates.priority = priority;
    }


    if (due_date !== undefined) {
      updates.due_date =
        due_date;
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
          error:
            "Ingen endringer ble sendt.",
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


    // ==================================================
    // FIND EMPLOYEE BEING ASSIGNED
    // ==================================================
    //
    // This happens BEFORE updating the task.
    //
    // We need their email address for EmailJS.
    //
    // ==================================================

    let assignedEmployee:
      {
        id: string | number;
        name: string;
        email: string;
        role: string;
      } | null = null;


    if (assigningNewEmployee) {

      const {
        data: employee,
        error: employeeError,
      } = await supabase
        .from("users")
        .select(
          "id, name, email, role"
        )
        .eq("id", receiver_id)
        .single();


      if (
        employeeError ||
        !employee
      ) {

        console.error(
          "ASSIGNED EMPLOYEE LOOKUP ERROR:",
          employeeError
        );


        return NextResponse.json(
          {
            success: false,
            error:
              "Den valgte ansatte ble ikke funnet.",
          },
          { status: 404 }
        );

      }


      // ------------------------------------------------
      // Make sure the selected user really is an employee
      // ------------------------------------------------

      if (
        employee.role !== "employee"
      ) {

        return NextResponse.json(
          {
            success: false,
            error:
              "Du kan bare tildele saker til ansatte.",
          },
          { status: 400 }
        );

      }


      // ------------------------------------------------
      // Make sure employee has an email
      // ------------------------------------------------

      if (!employee.email) {

        return NextResponse.json(
          {
            success: false,
            error:
              "Den ansatte har ingen registrert e-postadresse.",
          },
          { status: 400 }
        );

      }


      assignedEmployee = employee;

    }


    // ==================================================
    // UPDATE TASK
    // ==================================================

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
          error:
            "Kunne ikke oppdatere saken.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // CREATE USER NOTIFICATION WHEN TASK IS COMPLETED
    // ==================================================

    const completingTask =
      status === "completed" &&
      currentTask.status !==
        "completed";


    if (
      completingTask &&
      currentTask.sender_id
    ) {

      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id:
            currentTask.sender_id,

          type:
            "task_completed",

          task_id:
            id,

          message:
            `Sak #${id} er ferdig behandlet.`,

          is_read:
            false,
        });


      if (notificationError) {

        console.error(
          "TASK COMPLETION NOTIFICATION ERROR:",
          notificationError
        );

      }

    }


    // ==================================================
    // EMPLOYEE ASSIGNMENT
    // ==================================================

    if (
      assigningNewEmployee &&
      assignedEmployee
    ) {

      // -----------------------------------------------
      // Create in-app notification
      // -----------------------------------------------

      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id:
            receiver_id,

          type:
            "task_assigned",

          task_id:
            id,

          message:
            `Du har fått tildelt sak #${id}.`,

          is_read:
            false,
        });


      if (notificationError) {

        console.error(
          "TASK ASSIGNMENT NOTIFICATION ERROR:",
          notificationError
        );

      }


      // -----------------------------------------------
      // SEND EMAIL
      // -----------------------------------------------

      try {

        await sendTaskAssignmentEmail({

          employeeEmail:
            assignedEmployee.email,

          employeeName:
            assignedEmployee.name,

          taskId:
            id,

          taskCategory:
            data?.category,

          taskPriority:
            data?.priority,

          dueDate:
            data?.due_date,

          taskContent:
            data?.content,

          assignedBy:
            user.name,

        });


        console.log(
          `TASK ASSIGNMENT EMAIL SENT TO ${assignedEmployee.email}`
        );


      } catch (emailError) {

        console.error(
          "TASK ASSIGNMENT EMAIL ERROR:",
          emailError
        );

        // ---------------------------------------------
        // IMPORTANT:
        //
        // The task WAS successfully assigned.
        //
        // If EmailJS fails, we do NOT undo the
        // database update.
        // ---------------------------------------------

      }

    }


    // ==================================================
    // SUCCESS
    // ==================================================

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
        error:
          "Kunne ikke oppdatere saken.",
      },
      { status: 500 }
    );

  }

}