import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const store = getStore();

  // Optional cap so callers that only need the newest run do not pull the full
  // run history (each run embeds the whole reviewed diff) over the wire.
  const limitParam = new URL(req.url).searchParams.get("limit");
  let runs = store.runs;
  if (limitParam !== null) {
    const limit = Number(limitParam);
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json({ success: false, error: "limit must be an integer between 1 and 100." }, { status: 400 });
    }
    runs = runs.slice(0, limit);
  }

  return NextResponse.json({
    success: true,
    runs,
  });
}
