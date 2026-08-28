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