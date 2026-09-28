import { NextRequest, NextResponse } from "next/server";
import { recallMemories } from "@/lib/hindsight";

export async function POST(req: NextRequest) {
  const { message = "" } = await req.json();
  const result = await recallMemories(String(message), { top_k: 3 });
  if (!result.memories.length) {
    return NextResponse.json({ message: "I could not find a relevant engineering memory for that question. Try asking about a specific file, standard, or previous review." });
  }
  const context = result.memories.map((m) => `${m.title} (${Math.round((m.relevance_score || 0.85) * 100)}%): ${m.content}`).join("\n");
  return NextResponse.json({ message: `I found ${result.memories.length} relevant engineering memories.\n\n${context}` });
}
