import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

async function getUser() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUser();

  if (!user) {
    return NextResponse.json({ lists: [], demoMode: true });
  }

  const { data: lists, error } = await supabase
    .from("lead_lists")
    .select("id, name, description, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = await Promise.all(
    (lists || []).map(async (list) => {
      const { count } = await supabase
        .from("lead_list_items")
        .select("id", { count: "exact", head: true })
        .eq("list_id", list.id)
        .eq("user_id", user.id);

      return {
        ...list,
        description: list.description || "",
        lead_count: count || 0
      };
    })
  );

  return NextResponse.json({ lists: rows, demoMode: false });
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to create lead lists." }, { status: 401 });
  }

  const payload = (await request.json()) as { name?: string; description?: string };
  const name = payload.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "List name is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lead_lists")
    .insert({
      user_id: user.id,
      name,
      description: payload.description?.trim() || ""
    })
    .select("id, name, description, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ list: { ...data, description: data.description || "", lead_count: 0 } });
}
