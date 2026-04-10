import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/", request.url));
}
