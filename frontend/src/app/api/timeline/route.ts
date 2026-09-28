import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get('service');
  const eventType = searchParams.get('eventType');
  const search = searchParams.get('search')?.toLowerCase();

  const store = getStore();
  let timeline = [...store.timeline];

  if (service && service !== 'all') {
    timeline = timeline.filter(n => n.service.toLowerCase() === service.toLowerCase());
  }

  if (eventType && eventType !== 'all') {
    timeline = timeline.filter(n => n.type.toLowerCase().includes(eventType.toLowerCase()));
  }

  if (search) {
    timeline = timeline.filter(
      n => n.title.toLowerCase().includes(search) || n.subtitle.toLowerCase().includes(search)
    );
  }

  const guardrails = store.guardrails;

  return NextResponse.json({
    success: true,
    timeline,
    guardrails,
  });
}
