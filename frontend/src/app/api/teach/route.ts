import { NextRequest, NextResponse } from 'next/server';
import { retainMemory } from '@/lib/hindsight';
import { getStore, saveStore } from '@/lib/storage';
import { CausalTimelineNode } from '@/lib/types';
import { readCappedJson } from '@/lib/rate-limit';

const ALLOWED_OUTCOMES = ['Failed in staging', 'Shipped clean', 'Rolled back', 'Caught in review'] as const;
type TeachOutcome = (typeof ALLOWED_OUTCOMES)[number];
const clamp = (value: unknown, max: number): string => String(value ?? '').slice(0, max);

export async function POST(req: NextRequest) {
  try {
    const guard = await readCappedJson(req, {
      bucket: 'teach',
      limit: 10,
      windowMs: 60_000,
      maxBodyBytes: 16_000,
    });
    if (!guard.ok) return guard.response;
    const body = guard.body ?? {};
    const {
      related_run_id,
      related_change_title,
      service,
      outcome,
      root_cause = '',
      what_fixed_it = '',
      was_recommendation_helpful = 'Yes, it caught the risk early',
    } = body;

    // These three fields are the payload of the memory itself. Defaults here
    // used to invent a plausible PR #167 analytics story for any request that
    // omitted them, silently polluting the memory bank with fake history.
    if (typeof related_change_title !== 'string' || related_change_title.trim() === '') {
      return NextResponse.json({ success: false, error: 'related_change_title is required.' }, { status: 400 });
    }
    if (typeof service !== 'string' || service.trim() === '') {
      return NextResponse.json({ success: false, error: 'service is required.' }, { status: 400 });
    }
    if (typeof outcome !== 'string' || !ALLOWED_OUTCOMES.includes(outcome as TeachOutcome)) {
      return NextResponse.json(
        { success: false, error: `outcome must be one of: ${ALLOWED_OUTCOMES.join(', ')}` },
        { status: 400 }
      );
    }

    // 1. Store outcome in Hindsight. The focus area is a disclosure, not a
    //    finding: the taught outcome never went through migration analysis, so
    //    claiming the 'Unsafe DB migration' focus would pollute recall filters
    //    and the pulse endpoint's repeated-risk counts.
    const retainResult = await retainMemory({
      title: `Outcome: ${clamp(related_change_title, 140)} (${outcome})`,
      type: 'outcome_feedback',
      service: clamp(service, 80),
      content: `Deployment Outcome: ${outcome}\nRoot Cause: ${clamp(root_cause, 2000)}\nResolution / What Fixed It: ${clamp(what_fixed_it, 2000)}\nReview Feedback: ${clamp(was_recommendation_helpful, 200)}`,
      relevance_note: `Taught outcome for: ${clamp(related_change_title, 80)}`,
      metadata: {
        related_run_id: clamp(related_run_id, 120),
        related_change_title: clamp(related_change_title, 140),
        outcome,
        was_recommendation_helpful,
        tags: ['outcome', 'resolution', outcome.toLowerCase().replace(/\s+/g, '-')],
      },
    });

    // 2. Add an updated node to the Causal Timeline
    const store = getStore();
    const newNodeId = `TL-${Date.now().toString(36)}`;
    const newTimelineNode: CausalTimelineNode = {
      id: newNodeId,
      date: 'Just now',
      title: `${clamp(related_change_title, 140)} — ${outcome}`,
      subtitle: clamp(what_fixed_it || root_cause || 'Outcome documented into team memory.', 300),
      type: outcome === 'Shipped clean' || outcome === 'Caught in review' ? 'PREVENTED RISK' : 'PIPELINE FAILURE',
      type_badge_color: outcome === 'Shipped clean' ? 'green' : outcome === 'Caught in review' ? 'cyan' : 'red',
      service,
      is_active_pattern_member: true,
      related_run_id,
      details: `Root cause: ${root_cause}. Fix: ${what_fixed_it}`,
    };

    store.timeline.push(newTimelineNode);
    saveStore(store);

    return NextResponse.json({
      success: true,
      memory_id: retainResult.memory_id,
      pattern_action: retainResult.pattern_action,
      is_reinforced: retainResult.is_reinforced,
      confidence_score: retainResult.confidence_score,
      message: 'Outcome added to organizational memory',
      timeline_node_id: newNodeId,
    });
  } catch (error: any) {
    console.error('API /api/teach error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retain outcome' },
      { status: 500 }
    );
  }
}
