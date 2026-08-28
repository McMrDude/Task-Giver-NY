import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

import { supabase } from "../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


// ====================================================
// GET NOTIFICATIONS
// ====================================================

export async function GET() {

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

    const { payload } =
      await jwtVerify(
        token,
        secret
      );


    if (!payload.id) {

      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig innlogging.",
        },
        { status: 401 }
      );

    }


    const userId =
      String(payload.id);


    // ------------------------------------------------
    // LOAD NOTIFICATIONS
    // ------------------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });


    if (error) {

      console.error(
        "NOTIFICATIONS GET ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke hente varslinger.",
        },
        { status: 500 }
      );

    }


    // ------------------------------------------------
    // COUNT UNREAD
    // ------------------------------------------------

    const unreadCount =
      (data || []).filter(
        notification =>
          !notification.is_read
      ).length;


    // ------------------------------------------------
    // RESPONSE
    // ------------------------------------------------

    return NextResponse.json({

      success: true,

      data: data || [],

      unreadCount,

    });

  } catch (error) {

    console.error(
      "NOTIFICATIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Ugyldig innlogging.",
      },
      { status: 401 }
    );

  }

}

// ====================================================
// MARK NOTIFICATIONS AS READ
// ====================================================

export async function PATCH(
  request: Request
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

    const { payload } =
      await jwtVerify(
        token,
        secret
      );


    if (!payload.id) {

      return NextResponse.json(
        {
          success: false,
          error: "Ugyldig innlogging.",
        },
        { status: 401 }
      );

    }


    const userId =
      String(payload.id);


    // ------------------------------------------------
    // READ REQUEST
    // ------------------------------------------------

    const body =
      await request.json();


    const notificationId =
      body.id;


    // ------------------------------------------------
    // MARK ONE NOTIFICATION AS READ
    // ------------------------------------------------

    if (notificationId) {

      const {
        data,
        error,
      } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notificationId)
        .eq("user_id", userId)
        .select()
        .single();


      if (error) {

        console.error(
          "MARK NOTIFICATION READ ERROR:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Kunne ikke merke varslingen som lest.",
          },
          { status: 500 }
        );

      }


      return NextResponse.json({

        success: true,

        data,

      });

    }


    // ------------------------------------------------
    // MARK ALL AS READ
    // ------------------------------------------------

    const {
      error,
    } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("user_id", userId)
      .eq("is_read", false);


    if (error) {

      console.error(
        "MARK ALL NOTIFICATIONS READ ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke merke varslingene som lest.",
        },
        { status: 500 }
      );

    }


    return NextResponse.json({

      success: true,

    });

  } catch (error) {

    console.error(
      "NOTIFICATIONS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Ugyldig innlogging.",
      },
      { status: 401 }
    );

  }

}