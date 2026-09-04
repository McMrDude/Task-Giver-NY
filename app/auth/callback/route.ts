import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=google_login_failed", requestUrl.origin)
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("GOOGLE CALLBACK ERROR:", error);

    return NextResponse.redirect(
      new URL("/login?error=google_login_failed", requestUrl.origin)
    );
  }

  const googleUser = data.session.user;

  console.log("GOOGLE USER:", googleUser);

  return NextResponse.redirect(
    new URL("/", requestUrl.origin)
  );
}