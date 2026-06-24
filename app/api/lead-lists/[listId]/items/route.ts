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

async function ownedLeadIds(supabase: ReturnType<typeof createRouteHandlerClient>, userId: string, leadIds: string[]) {
  if (leadIds.length === 0) return [];

  const { data: searches } = await supabase.from("searches").select("id").eq("user_id", userId);
  const searchIds = (searches || []).map((search) => search.id);
  if (searchIds.length === 0) return [];

  const { data: leads } = await supabase.from("leads").select("id").in("id", leadIds).in("search_id", searchIds);
  return (leads || []).map((lead) => lead.id);
}

export async function POST(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const { supabase, user } = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to add leads to a list." }, { status: 401 });
  }

  const payload = (await request.json()) as { leadIds?: string[] };
  const requestedLeadIds = Array.from(new Set((payload.leadIds || []).filter(Boolean)));

  const { data: list } = await supabase
    .from("lead_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) {
    return NextResponse.json({ error: "Lead list not found." }, { status: 404 });
  }

  const leadIds = await ownedLeadIds(supabase, user.id, requestedLeadIds);

  if (leadIds.length === 0) {
    return NextResponse.json({ added: 0, skipped: requestedLeadIds.length });
  }

  const { error } = await supabase.from("lead_list_items").upsert(
    leadIds.map((leadId) => ({
      list_id: listId,
      lead_id: leadId,
      user_id: user.id
    })),
    { onConflict: "list_id,lead_id", ignoreDuplicates: true }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("lead_lists").update({ updated_at: new Date().toISOString() }).eq("id", listId).eq("user_id", user.id);

  return NextResponse.json({ added: leadIds.length, skipped: requestedLeadIds.length - leadIds.length });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const { supabase, user } = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to remove leads from a list." }, { status: 401 });
  }

  const payload = (await request.json()) as { leadIds?: string[] };
  const leadIds = Array.from(new Set((payload.leadIds || []).filter(Boolean)));

  if (leadIds.length === 0) {
    return NextResponse.json({ removed: 0 });
  }

  const { error } = await supabase
    .from("lead_list_items")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", user.id)
    .in("lead_id", leadIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("lead_lists").update({ updated_at: new Date().toISOString() }).eq("id", listId).eq("user_id", user.id);

  return NextResponse.json({ removed: leadIds.length });
}
