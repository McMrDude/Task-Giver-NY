import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


// ====================================================
// GET
// ====================================================

export async function GET() {

  try {

    // ------------------------------------------------
    // CHECK LOGIN
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
    // VERIFY TOKEN
    // ------------------------------------------------

    const { payload } =
      await jwtVerify(
        token,
        secret
      );


    // ------------------------------------------------
    // CHECK ADMIN
    // ------------------------------------------------

    if (payload.role !== "admin") {

      return NextResponse.json(
        {
          success: false,
          error: "Du har ikke tilgang til dette.",
        },
        { status: 403 }
      );

    }


    // ==================================================
    // GET EMPLOYEES
    // ==================================================

    const {
      data: employees,
      error: employeeError,
    } = await supabase
      .from("users")
      .select(
        "id, name, email, role, phone_number"
      )
      .eq("role", "employee")
      .order("name");


    if (employeeError) {

      console.error(
        "EMPLOYEE FETCH ERROR:",
        employeeError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke hente ansatte.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // GET ALL TASKS
    // ==================================================

    const {
      data: tasks,
      error: taskError,
    } = await supabase
      .from("tasks")
      .select(`
        id,
        receiver_id,
        sender_id,
        content,
        category,
        subcategory,
        status,
        priority,
        due_date,
        created_at
      `)
      .not("receiver_id", "is", null)
      .order("created_at", {
        ascending: false,
      });


    if (taskError) {

      console.error(
        "EMPLOYEE TASK FETCH ERROR:",
        taskError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke hente ansattes saker.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // ADD TASKS TO EACH EMPLOYEE
    // ==================================================

    const employeeData =
      (employees || []).map(employee => {

        const employeeTasks =
          (tasks || []).filter(
            task =>
              String(task.receiver_id) ===
              String(employee.id)
          );


        // ----------------------------------------------
        // CURRENT TASKS
        // ----------------------------------------------

        const currentTasks =
          employeeTasks.filter(
            task =>
              task.status !== "completed" &&
              task.status !== "cancelled"
          );


        // ----------------------------------------------
        // COMPLETED TASKS
        // ----------------------------------------------

        const completedTasks =
          employeeTasks.filter(
            task =>
              task.status === "completed"
          );


        return {

          id: employee.id,

          name: employee.name,

          email: employee.email,

          role: employee.role,

          // Can be null for older accounts
          phone_number:
            employee.phone_number || null,

          currentTaskCount:
            currentTasks.length,

          currentTasks,

          completedTasks,

        };

      });


    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json({

      success: true,

      data: employeeData,

    });


  } catch (error) {

    console.error(
      "ADMIN USERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Ugyldig innlogging.",
      },
      { status: 401 }
    );

  }

}