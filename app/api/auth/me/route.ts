import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          user: null,
        },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      success: true,
      user: {
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        user: null,
      },
      { status: 401 }
    );
  }
}