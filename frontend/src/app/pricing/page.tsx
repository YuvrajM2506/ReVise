"use client";
import { navigate } from "@/revise-ui/components/Shell";
import { Badge, Button, Card, Heading, SectionHeader, Text } from '@/revise-ui/components/ui';

const plans = [
  {
    tier: 'Free',
    name: 'Developer',
    audience: 'Perfect for individuals and open-source.',
    price: null,
    per: '/ month',
    features: ['1 Repository connection', '30 PR reviews & fixes / month', '50MB Hindsight Memory (Short-term)', 'Community support'],
    cta: { label: 'Use ReVise now', destination: '/analyze' },
    highlight: false,
  },
  {
    tier: 'Pro',
    name: 'Startup',
    audience: 'For small to medium engineering teams.',
    price: null,
    per: '/ repo / month',
    features: ['Up to 10 Repositories', '500 PR reviews & fixes / month', '1GB Deep Hindsight Memory', 'Priority GitHub API Execution', 'Slack & Teams Integrations'],
    cta: { label: 'Analyze a pull request', destination: '/github-review' },
    highlight: true,
  },
  {
    tier: 'Enterprise',
    name: 'Enterprise',
    audience: 'For massive codebases & strict compliance.',
    price: 'Custom',
    per: null,
    features: ['Unlimited Repositories & PRs', 'Dedicated Vector Database', 'Fine-tuned Models on your codebase', 'On-Premise / VPC Deployment', 'Dedicated 24/7 Support SLA'],
    cta: { label: 'Open the workspace', destination: '/dashboard' },
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="animate-enter">
      <SectionHeader
        eyebrow="Revenue Model"
        title="ReVise Pricing Plans"
        action={<Badge tone="warning">Hackathon Draft</Badge>}
      />
      <Text className="-mt-2 mb-10 max-w-2xl text-sm leading-6 text-muted">
        Pricing scales with repository complexity: Hindsight memory and AI auto-fixes are resource-intensive, so tiers fit everything from indie projects to enterprise monoliths.
      </Text>

      {/* The per-seat amounts are a business decision, not a UI placeholder: they
          are left out here rather than inventing numbers the product does not
          charge yet. See REVENUE_MODEL.md for the open question. */}
      <Card className="mb-10 border-attention/30 p-4">
        <Text className="text-sm text-muted">
          <span className="font-semibold text-attention">Pricing not final.</span>{' '}
          This hackathon build does not charge for usage yet, so per-month amounts are
          intentionally omitted. Every other limit below reflects what the product is
          designed to support.
        </Text>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.tier} className={`relative flex flex-col ${plan.highlight ? 'border-brand/40' : ''}`}>
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge tone="brand">Recommended</Badge>
              </div>
            )}
            <div className={`mb-4 ${plan.highlight ? 'mt-2' : ''}`}>
              <Badge>{plan.tier}</Badge>
              <Heading level={3} className="mt-4 text-2xl">{plan.name}</Heading>
              <Text className="mt-2 text-sm text-muted">{plan.audience}</Text>
            </div>
            <div className="mb-6 border-b border-line pb-6">
              <span className="text-4xl font-bold">{plan.price ?? '—'}</span>
              {plan.per && <span className="text-sm text-muted"> {plan.per}</span>}
            </div>
            <ul className="mb-8 flex-1 space-y-3 text-sm text-muted">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            {/* CTAs route into the real product rather than dead-ending, because
                this build has no billing or signup flow to link to. */}
            <Button
              variant={plan.highlight ? 'primary' : 'secondary'}
              className="w-full"
              onClick={() => navigate(plan.cta.destination)}
            >
              {plan.cta.label}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
