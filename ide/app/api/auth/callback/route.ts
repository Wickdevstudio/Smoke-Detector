import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const supabase = createServerClient();

    // Exchange code for session (not applicable with service role)
    // For client-side OAuth, the Supabase JS client handles this automatically
    // This route handles the redirect after Google OAuth

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}
