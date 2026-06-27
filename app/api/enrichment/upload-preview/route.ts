import { NextResponse } from "next/server";
import { parseCsvUpload, defaultColumnMapping } from "@/lib/csv-upload";

export async function POST(request: Request) {
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
