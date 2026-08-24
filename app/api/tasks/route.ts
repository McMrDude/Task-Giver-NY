import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabase } from "../supabaseClient";

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


export async function GET() {
  try {

    const user = await getCurrentUser();

    // Not logged in
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Du må være logget inn.",
        },
        { status: 401 }
      );
    }

    // Only admins can see all tasks
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Du har ikke tilgang til denne siden.",
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

    console.error("TASK GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Kunne ikke hente saker.",
      },
      { status: 500 }
    );
  }
}