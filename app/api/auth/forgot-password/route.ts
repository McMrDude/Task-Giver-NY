import { NextResponse } from "next/server";
import crypto from "crypto";
import emailjs from "@emailjs/nodejs";
import { supabase } from "../../supabaseClient";


// ====================================================
// SEND PASSWORD RESET EMAIL
// ====================================================

async function sendPasswordResetEmail({
  employeeEmail,
  employeeName,
  resetUrl,
}: {
  employeeEmail: string;
  employeeName: string;
  resetUrl: string;
}) {

  const serviceId =
    process.env.EMAILJS_SERVICE_ID;

  const templateId =
    process.env.EMAILJS_TEMPLATE_ID_PASSWORD_RESET;

  const publicKey =
    process.env.EMAILJS_PUBLIC_KEY;

  const privateKey =
    process.env.EMAILJS_PRIVATE_KEY;


  if (
    !serviceId ||
    !templateId ||
    !publicKey
  ) {
    throw new Error(
      "EmailJS password reset environment variables are missing."
    );
  }


  await emailjs.send(
    serviceId,
    templateId,

    {
      to_email:
        employeeEmail,

      to_name:
        employeeName,

      reset_url:
        resetUrl,
    },

    {
      publicKey,

      ...(privateKey
        ? { privateKey }
        : {}),
    }
  );
}


// ====================================================
// POST
// ====================================================

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();


    const email =
      body.email
        ?.trim()
        .toLowerCase();


    if (!email) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Skriv inn e-postadressen din.",
        },
        { status: 400 }
      );

    }


    // ==================================================
    // FIND USER
    // ==================================================

    const {
      data: user,
      error: userError,
    } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", email)
      .maybeSingle();


    if (userError) {

      console.error(
        "FORGOT PASSWORD USER LOOKUP ERROR:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Noe gikk galt. Prøv igjen senere.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // IMPORTANT SECURITY MEASURE
    // ==================================================
    //
    // We do NOT tell the user whether the email
    // address exists in our database.
    //
    // ==================================================

    if (!user) {

      return NextResponse.json({
        success: true,
        message:
          "Hvis e-postadressen finnes, vil du motta en e-post med en lenke for å tilbakestille passordet.",
      });

    }


    // ==================================================
    // GENERATE RANDOM RESET TOKEN
    // ==================================================

    const resetToken =
      crypto.randomBytes(32).toString("hex");


    // ==================================================
    // HASH TOKEN BEFORE STORING IT
    // ==================================================

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");


    // ==================================================
    // TOKEN EXPIRES IN 30 MINUTES
    // ==================================================

    const expiresAt =
      new Date(
        Date.now() +
        30 * 60 * 1000
      ).toISOString();


    // ==================================================
    // REMOVE OLD RESET TOKENS
    // ==================================================

    const {
      error: deleteError,
    } = await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", user.id);


    if (deleteError) {

      console.error(
        "OLD PASSWORD RESET TOKEN DELETE ERROR:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Noe gikk galt. Prøv igjen senere.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // STORE NEW TOKEN
    // ==================================================

    const {
      error: insertError,
    } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id:
          user.id,

        token_hash:
          tokenHash,

        expires_at:
          expiresAt,
      });


    if (insertError) {

      console.error(
        "PASSWORD RESET TOKEN INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Noe gikk galt. Prøv igjen senere.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // CREATE RESET URL
    // ==================================================

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL;


    if (!appUrl) {

      console.error(
        "NEXT_PUBLIC_APP_URL is missing."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Serveren mangler nødvendig konfigurasjon.",
        },
        { status: 500 }
      );

    }


    const resetUrl =
      `${appUrl}/reset-password?token=${resetToken}`;


    // ==================================================
    // SEND EMAIL
    // ==================================================

    try {

      await sendPasswordResetEmail({

        employeeEmail:
          user.email,

        employeeName:
          user.name,

        resetUrl,

      });


      console.log(
        `PASSWORD RESET EMAIL SENT TO ${user.email}`
      );


    } catch (emailError) {

      console.error(
        "PASSWORD RESET EMAIL ERROR:",
        emailError
      );


      // Remove the token because the email wasn't sent.
      await supabase
        .from("password_reset_tokens")
        .delete()
        .eq("token_hash", tokenHash);


      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke sende e-posten. Prøv igjen senere.",
        },
        { status: 500 }
      );

    }


    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json({

      success: true,

      message:
        "Hvis e-postadressen finnes, vil du motta en e-post med en lenke for å tilbakestille passordet.",

    });


  } catch (error) {

    console.error(
      "FORGOT PASSWORD ERROR:",
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