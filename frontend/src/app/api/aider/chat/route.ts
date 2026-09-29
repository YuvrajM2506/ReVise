import { NextRequest, NextResponse } from "next/server";
import { recallMemories } from "@/lib/hindsight";
import { readCappedJson } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const guard = await readCappedJson(req, {
    bucket: 'aider-chat',
    limit: 30,
    windowMs: 60_000,
    maxBodyBytes: 4_000,
  });
  if (!guard.ok) return guard.response;

  const message = String(guard.body?.message ?? '');
  if (message.trim() === '') {
    return NextResponse.json({ success: false, error: 'message is required.' }, { status: 400 });
  }

  const result = await recallMemories(message.slice(0, 500), { top_k: 3 });
  if (!result.memories.length) {
    return NextResponse.json({ message: "I could not find a relevant engineering memory for that question. Try asking about a specific file, standard, or previous review." });
  }
  const context = result.memories.map((m) => `${m.title} (${Math.round((m.relevance_score || 0.85) * 100)}%): ${m.content}`).join("\n");
  return NextResponse.json({ message: `I found ${result.memories.length} relevant engineering memories.\n\n${context}` });
}
