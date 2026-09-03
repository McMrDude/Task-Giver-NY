import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { supabase } from "../../supabaseClient";


// ====================================================
// POST
// ====================================================

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();


    const token =
      body.token?.trim();

    const password =
      body.password;


    // ==================================================
    // VALIDATE INPUT
    // ==================================================

    if (!token || !password) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Token og passord må fylles ut.",
        },
        { status: 400 }
      );

    }


    // ==================================================
    // PASSWORD LENGTH
    // ==================================================

    if (password.length < 8) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Passordet må være minst 8 tegn.",
        },
        { status: 400 }
      );

    }


    // ==================================================
    // HASH TOKEN
    // ==================================================

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");


    // ==================================================
    // FIND RESET TOKEN
    // ==================================================

    const {
      data: resetToken,
      error: tokenError,
    } = await supabase
      .from("password_reset_tokens")
      .select(
        "id, user_id, expires_at"
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();


    if (tokenError) {

      console.error(
        "RESET TOKEN LOOKUP ERROR:",
        tokenError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke behandle forespørselen.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // INVALID TOKEN
    // ==================================================

    if (!resetToken) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Denne tilbakestillingslenken er ugyldig eller har allerede blitt brukt.",
        },
        { status: 400 }
      );

    }


    // ==================================================
    // CHECK EXPIRATION
    // ==================================================

    const expiresAt =
      new Date(
        resetToken.expires_at
      );


    if (
      expiresAt.getTime() <=
      Date.now()
    ) {

      // Delete expired token

      await supabase
        .from("password_reset_tokens")
        .delete()
        .eq(
          "id",
          resetToken.id
        );


      return NextResponse.json(
        {
          success: false,
          error:
            "Denne tilbakestillingslenken har utløpt. Be om en ny.",
        },
        { status: 400 }
      );

    }


    // ==================================================
    // HASH NEW PASSWORD
    // ==================================================

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );


    // ==================================================
    // UPDATE USER PASSWORD
    // ==================================================

    const {
      error: updateError,
    } = await supabase
      .from("users")
      .update({
        password_hash:
          passwordHash,
      })
      .eq(
        "id",
        resetToken.user_id
      );


    if (updateError) {

      console.error(
        "PASSWORD UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke oppdatere passordet.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // DELETE USED TOKEN
    // ==================================================

    const {
      error: deleteError,
    } = await supabase
      .from("password_reset_tokens")
      .delete()
      .eq(
        "id",
        resetToken.id
      );


    if (deleteError) {

      console.error(
        "USED TOKEN DELETE ERROR:",
        deleteError
      );

      // The password has already been changed.
      // Log the error, but don't tell the user
      // that the password update failed.

    }


    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json({

      success: true,

      message:
        "Passordet ditt er nå endret.",

    });


  } catch (error) {

    console.error(
      "RESET PASSWORD ERROR:",
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