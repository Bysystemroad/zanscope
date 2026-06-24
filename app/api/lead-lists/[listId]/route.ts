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

export async function PATCH(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const { supabase, user } = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to update lead lists." }, { status: 401 });
  }

  const payload = (await request.json()) as { name?: string; description?: string };
  const name = payload.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "List name is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lead_lists")
    .update({
      name,
      description: payload.description?.trim() || "",
      updated_at: new Date().toISOString()
    })
    .eq("id", listId)
    .eq("user_id", user.id)
    .select("id, name, description, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Lead list not found." }, { status: 404 });
  }

  return NextResponse.json({ list: { ...data, description: data.description || "" } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const { supabase, user } = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to delete lead lists." }, { status: 401 });
  }

  const { error } = await supabase.from("lead_lists").delete().eq("id", listId).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
