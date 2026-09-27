import { NextRequest, NextResponse } from 'next/server';
import { retainMemory } from '@/lib/hindsight';
import { getStore, saveStore } from '@/lib/storage';
import { CausalTimelineNode } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      related_run_id,
      related_change_title = 'PR #167 — Add customer-region analytics',
      service = 'orders-service',
      outcome = 'Failed in staging',
      root_cause = '',
      what_fixed_it = '',
      was_recommendation_helpful = 'Yes, it caught the risk early',
    } = body;

    // 1. Store outcome in Hindsight
    const retainResult = await retainMemory({
      title: `Outcome: ${related_change_title} (${outcome})`,
      type: 'outcome_feedback',
      service,
      content: `Deployment Outcome: ${outcome}\nRoot Cause: ${root_cause}\nResolution / What Fixed It: ${what_fixed_it}\nReview Feedback: ${was_recommendation_helpful}`,
      relevance_note: `Resolved staging outcome: ${what_fixed_it.slice(0, 50)}...`,
      metadata: {
        related_run_id,
        related_change_title,
        outcome,
        was_recommendation_helpful,
        focus_areas: ['Unsafe DB migration'],
        tags: ['outcome', 'resolution', outcome.toLowerCase().replace(/\s+/g, '-')],
      },
    });

    // 2. Add an updated node to the Causal Timeline
    const store = getStore();
    const newNodeId = `TL-${Date.now().toString(36)}`;
    const newTimelineNode: CausalTimelineNode = {
      id: newNodeId,
      date: 'Just now',
      title: `${related_change_title} — ${outcome}`,
      subtitle: what_fixed_it || root_cause || 'Outcome documented into team memory.',
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
