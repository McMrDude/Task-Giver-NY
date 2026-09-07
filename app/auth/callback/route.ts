import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabase } from "../../api/supabaseClient";
import { SignJWT } from "jose";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  console.log("GOOGLE CALLBACK REQUEST URL:", request.url);

  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=google_login_failed", requestUrl.origin)
    );
  }

  const cookieStore = await cookies();

  // Supabase Auth client
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookies may already have been set by the framework.
          }
        },
      },
    }
  );

  // Exchange Google's code for a Supabase session
  const { data, error } =
    await authSupabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("GOOGLE CALLBACK ERROR:", error);

    return NextResponse.redirect(
      new URL("/login?error=google_login_failed", requestUrl.origin)
    );
  }

  const googleUser = data.session.user;

  console.log("GOOGLE LOGIN SUCCESS:", googleUser);

  const email = googleUser.email?.trim().toLowerCase();

  if (!email) {
    console.error("GOOGLE LOGIN ERROR: Google account has no email");

    return NextResponse.redirect(
      new URL("/login?error=google_login_failed", requestUrl.origin)
    );
  }

  // Check if this email already exists in our users table
  const { data: existingUser, error: userLookupError } = await supabase
    .from("users")
    .select("id, name, email, role, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (userLookupError) {
    console.error("USER LOOKUP ERROR:", userLookupError);

    return NextResponse.redirect(
      new URL("/login?error=google_login_failed", requestUrl.origin)
    );
  }

  let user = existingUser;

  // If no Task Giver account exists yet, create one
  if (!user) {
    const name =
      googleUser.user_metadata?.full_name ||
      googleUser.user_metadata?.name ||
      email.split("@")[0];

    const { data: newUser, error: createUserError } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password_hash: null,
        auth_user_id: googleUser.id,
        role: "user",
      })
      .select("id, name, email, role, auth_user_id")
      .single();

    if (createUserError) {
      console.error("GOOGLE USER CREATION ERROR:", createUserError);

      return NextResponse.redirect(
        new URL("/login?error=google_login_failed", requestUrl.origin)
      );
    }

    user = newUser;

    console.log("GOOGLE TASK GIVER USER CREATED:", user);
  } else {
    // Existing Task Giver account.
    // Connect it to the Supabase Auth user if it isn't connected yet.
    if (!user.auth_user_id) {
      const { data: updatedUser, error: updateUserError } = await supabase
        .from("users")
        .update({
          auth_user_id: googleUser.id,
        })
        .eq("id", user.id)
        .select("id, name, email, role, auth_user_id")
        .single();

      if (updateUserError) {
        console.error("GOOGLE USER LINK ERROR:", updateUserError);

        return NextResponse.redirect(
          new URL("/login?error=google_login_failed", requestUrl.origin)
        );
      }

      user = updatedUser;

      console.log("EXISTING USER LINKED TO GOOGLE:", user);
    }
  }

  /*
   * At this point:
   *
   * Supabase knows the Google user
   * AND
   * our users table knows the Task Giver user.
   *
   * Now create the same auth_token that normal
   * email/password login uses.
   */

  if (!process.env.AUTH_SECRET) {
    console.error("GOOGLE LOGIN ERROR: AUTH_SECRET is missing");

    return NextResponse.redirect(
      new URL("/login?error=google_login_failed", requestUrl.origin)
    );
  }

  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET
  );

  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  let redirectPath = "/";

  if (user.role === "admin") {
    redirectPath = "/admin";
  } else if (user.role === "employee") {
    redirectPath = "/employee";
  }

  const response = NextResponse.redirect(
    `https://task-giver-ny.onrender.com${redirectPath}`
  );

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}