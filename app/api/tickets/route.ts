import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


// ----------------------------------------------------
// GET
// ----------------------------------------------------

export async function GET() {
  try {

    // Get authentication cookie
    const cookieStore = await cookies();

    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være logget inn.",
        },
        { status: 401 }
      );
    }


    // Verify JWT
    const { payload } = await jwtVerify(
      token,
      secret
    );

    if (payload.role === "employee") {
        return NextResponse.json(
            {
            success: false,
            error: "Ansatte kan ikke opprette støttesaker.",
            },
            { status: 403 }
        );
    }


    // Make sure we have a user ID
    if (!payload.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig innlogging.",
        },
        { status: 401 }
      );
    }


    // Get tickets created by this user
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("sender_id", payload.id)
      .order("created_at", {
        ascending: false,
      });


    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error: "Kunne ikke hente støttesaker.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Ugyldig innlogging.",
      },
      { status: 401 }
    );

  }
}


// ----------------------------------------------------
// POST
// ----------------------------------------------------

export async function POST(request: Request) {
  try {

    // ====================================================
    // GET AUTH COOKIE
    // ====================================================

    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Du må være logget inn for å opprette en støttesak.",
        },
        { status: 401 }
      );
    }


    // ====================================================
    // VERIFY JWT
    // ====================================================

    const { payload } =
      await jwtVerify(
        token,
        secret
      );


    // ====================================================
    // USER ID
    // ====================================================

    if (!payload.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig innlogging.",
        },
        { status: 401 }
      );
    }


    // ====================================================
    // READ FORM DATA
    // ====================================================

    const formData =
      await request.formData();


    const content =
      String(
        formData.get("content") || ""
      ).trim();


    const category =
      String(
        formData.get("category") || ""
      ).trim();


    const subcategory =
      String(
        formData.get("subcategory") || ""
      ).trim();


    const priority =
      String(
        formData.get("priority") || ""
      ).trim();


    const due_date =
      String(
        formData.get("due_date") || ""
      ).trim();


    // ====================================================
    // VALIDATION
    // ====================================================

    if (
      !content ||
      !category ||
      !subcategory ||
      !priority
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Alle nødvendige felt må fylles ut.",
        },
        { status: 400 }
      );
    }


    // ====================================================
    // GET IMAGES
    // ====================================================

    const imageFiles =
      formData
        .getAll("images")
        .filter(
          value =>
            value instanceof File &&
            value.size > 0
        ) as File[];


    // ====================================================
    // IMAGE LIMITS
    // ====================================================

    const MAX_IMAGES = 5;

    const MAX_FILE_SIZE =
      5 * 1024 * 1024;

    const MAX_TOTAL_SIZE =
      20 * 1024 * 1024;


    if (
      imageFiles.length >
      MAX_IMAGES
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Du kan laste opp maksimalt 5 bilder.",
        },
        { status: 400 }
      );
    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];


    let totalSize = 0;


    for (const file of imageFiles) {

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Kun JPG, PNG, WEBP og GIF-bilder kan lastes opp.",
          },
          { status: 400 }
        );
      }


      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Hvert bilde kan maksimalt være 5 MB.",
          },
          { status: 400 }
        );
      }


      totalSize += file.size;

    }


    if (
      totalSize >
      MAX_TOTAL_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bildene kan totalt maksimalt være 20 MB.",
        },
        { status: 400 }
      );
    }


    // ====================================================
    // CREATE TASK
    // ====================================================

    const {
      data: task,
      error: taskError,
    } = await supabase
      .from("tasks")
      .insert([
        {
          sender_id: payload.id,
          receiver_id: null,

          content,
          category,
          subcategory,
          priority,

          due_date:
            due_date || null,

          status: "not_started",
        },
      ])
      .select()
      .single();


    if (taskError) {

      console.error(
        "TASK CREATE ERROR:",
        taskError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke opprette støttesaken.",
        },
        { status: 500 }
      );

    }


    // ====================================================
    // UPLOAD IMAGES
    // ====================================================

    const uploadedPaths: string[] = [];


    try {

      for (
        let index = 0;
        index < imageFiles.length;
        index++
      ) {

        const file =
          imageFiles[index];


        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";


        const uniqueName =
          `${crypto.randomUUID()}.${extension}`;


        const filePath =
          `tasks/${task.id}/${uniqueName}`;


        const {
          error: uploadError,
        } = await supabase.storage
          .from("task-attachments")
          .upload(
            filePath,
            file,
            {
              contentType:
                file.type,
              cacheControl:
                "3600",
              upsert: false,
            }
          );


        if (uploadError) {

          throw uploadError;

        }


        uploadedPaths.push(
          filePath
        );


        // ==================================================
        // SAVE ATTACHMENT METADATA
        // ==================================================

        const {
          error: attachmentError,
        } = await supabase
          .from("task_attachments")
          .insert({
            task_id: task.id,

            file_path:
              filePath,

            file_name:
              file.name,

            mime_type:
              file.type,

            size_bytes:
              file.size,
          });


        if (attachmentError) {

          throw attachmentError;

        }

      }


    } catch (uploadError) {

      console.error(
        "IMAGE UPLOAD ERROR:",
        uploadError
      );


      // --------------------------------------------------
      // CLEAN UP UPLOADED FILES
      // --------------------------------------------------

      if (
        uploadedPaths.length > 0
      ) {

        await supabase.storage
          .from("task-attachments")
          .remove(
            uploadedPaths
          );

      }


      // Delete the task as well

      await supabase
        .from("tasks")
        .delete()
        .eq(
          "id",
          task.id
        );


      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke laste opp bildene.",
        },
        { status: 500 }
      );

    }


    // ====================================================
    // SUCCESS
    // ====================================================

    return NextResponse.json({
      success: true,

      data: {
        ...task,

        attachments:
          imageFiles.map(
            file => ({
              file_name:
                file.name,
              mime_type:
                file.type,
              size_bytes:
                file.size,
            })
          ),
      },
    });


  } catch (error) {

    console.error(
      "POST /api/tickets error:",
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