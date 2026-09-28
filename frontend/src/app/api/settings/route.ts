import { NextRequest, NextResponse } from "next/server";
export async function PUT(req: NextRequest) {
  const settings = await req.json().catch(() => ({}));
  return NextResponse.json({ success: true, settings });
}
