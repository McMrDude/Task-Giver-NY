import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../../supabaseClient";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);


export async function GET() {

  try {

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


    const { payload } =
      await jwtVerify(
        token,
        secret
      );


    if (payload.role !== "admin") {

      return NextResponse.json(
        {
          success: false,
          error: "Du har ikke tilgang til dette.",
        },
        { status: 403 }
      );

    }


    const { data, error } =
      await supabase
        .from("users")
        .select(
          "id, name, email, role"
        )
        .eq("role", "employee")
        .order("name");


    if (error) {

      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error:
            "Kunne ikke hente ansatte.",
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