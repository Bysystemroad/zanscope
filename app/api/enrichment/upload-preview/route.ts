import { NextResponse } from "next/server";
import { VERIFIED_ACCOUNT_REQUIRED_MESSAGE, isEmailVerified } from "@/lib/auth-security";
import { parseCsvUpload, defaultColumnMapping } from "@/lib/csv-upload";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to preview CSV enrichment." }, { status: 401 });
  }

  if (!isEmailVerified(user)) {
    return NextResponse.json({ error: VERIFIED_ACCOUNT_REQUIRED_MESSAGE }, { status: 403 });
  }

  const payload = (await request.json()) as { fileName?: string; content?: string };

  if (!payload.content?.trim()) {
    return NextResponse.json({ error: "Upload a CSV file with at least one header row." }, { status: 400 });
  }

  const preview = parseCsvUpload(payload.content);

  if (preview.columns.length === 0) {
    return NextResponse.json({ error: "No columns were found in this CSV file." }, { status: 400 });
  }

  return NextResponse.json({
    fileName: payload.fileName || "uploaded-list.csv",
    ...preview,
    mapping: defaultColumnMapping(preview.columns)
  });
}
