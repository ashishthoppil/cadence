import { type NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";

// Landing point for magic links and email confirmations.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await serverSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
  }
  return NextResponse.redirect(new URL(safeNext, request.url));
}
