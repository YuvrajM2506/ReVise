import { NextResponse } from "next/server";
import { getStore } from "@/lib/storage";

export async function GET() {
  const store = getStore();
  const memories = store.memories.map((m) => ({
    id: m.id,
    title: m.title,
    content: m.content,
    category:
      m.type === "incident" ? "Historical Outcome" :
      m.type === "post_mortem" ? "Historical Outcome" :
      m.type === "standard" ? "Coding Standard" :
      m.metadata?.focus_areas?.includes("Missing secret") ? "Security Rule" :
      m.metadata?.focus_areas?.includes("API contract change") ? "Architecture Decision" :
      "Team Convention",
    source: m.metadata?.source_id || m.type,
    confidence: m.metadata?.confidence_score || Math.round((m.relevance_score || 0.85) * 100),
    date: m.timestamp,
    repository: m.service,
    usageCount: m.metadata?.usage_count || 0,
    reinforcements: m.causal_links?.prevented_by || [],
  }));
  return NextResponse.json(memories);
}
