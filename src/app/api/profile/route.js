import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function DELETE(request) {
  // First, verify the current user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create admin client using the service role key to bypass RLS and delete from Auth directly
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Calling deleteUser purges the Auth user, mapping to CASCADE deletes in public.profiles and related tables
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
