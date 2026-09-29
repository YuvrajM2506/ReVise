"use client";
import React from 'react';
import { Card, Heading, Text, Badge, Button, SectionHeader } from '@/revise-ui/components/ui';

export default function PricingPage() {
  return (
    <div className="animate-enter">
      <SectionHeader 
        eyebrow="Revenue Model" 
        title="ReVise Pricing Plans" 
        action={<Badge tone="brand">Hackathon Draft</Badge>}
      />
      <Text className="-mt-2 mb-10 max-w-2xl text-sm leading-6 text-muted">
        Our pricing scales with your repository's complexity. Hindsight memory and AI auto-fixes are resource-intensive, so we designed tiers to fit everything from indie projects to enterprise monoliths.
      </Text>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Free Tier */}
        <Card className="flex flex-col">
          <div className="mb-4">
            <Badge>Free</Badge>
            <Heading level={3} className="mt-4 text-2xl">Developer</Heading>
            <Text className="mt-2 text-sm text-muted">Perfect for individuals and open-source.</Text>
          </div>
          <div className="mb-6 border-b border-line pb-6">
            <span className="text-4xl font-bold"></span>
            <span className="text-sm text-muted"> / month</span>
          </div>
          <ul className="mb-8 flex-1 space-y-3 text-sm text-muted">
            <li>• 1 Repository connection</li>
            <li>• 30 PR reviews & fixes / month</li>
            <li>• 50MB Hindsight Memory (Short-term)</li>
            <li>• Community support</li>
          </ul>
          <Button variant="secondary" className="w-full">Get Started</Button>
        </Card>

        {/* Pro Tier */}
        <Card className="relative flex flex-col border-brand/40 bg-surface">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge tone="brand">Recommended</Badge>
          </div>
          <div className="mb-4 mt-2">
            <Badge>Pro</Badge>
            <Heading level={3} className="mt-4 text-2xl">Startup</Heading>
            <Text className="mt-2 text-sm text-muted">For small to medium engineering teams.</Text>
          </div>
          <div className="mb-6 border-b border-line pb-6">
            <span className="text-4xl font-bold"></span>
            <span className="text-sm text-muted"> / repo / month</span>
          </div>
          <ul className="mb-8 flex-1 space-y-3 text-sm text-muted">
            <li>• Up to 10 Repositories</li>
            <li>• 500 PR reviews & fixes / month</li>
            <li className="text-brand">• 1GB Deep Hindsight Memory</li>
            <li>• Priority GitHub API Execution</li>
            <li>• Slack & Teams Integrations</li>
          </ul>
          <Button variant="primary" className="w-full">Start Free Trial</Button>
        </Card>

        {/* Enterprise Tier */}
        <Card className="flex flex-col">
          <div className="mb-4">
            <Badge>Enterprise</Badge>
            <Heading level={3} className="mt-4 text-2xl">Enterprise</Heading>
            <Text className="mt-2 text-sm text-muted">For massive codebases & strict compliance.</Text>
          </div>
          <div className="mb-6 border-b border-line pb-6">
            <span className="text-4xl font-bold">Custom</span>
          </div>
          <ul className="mb-8 flex-1 space-y-3 text-sm text-muted">
            <li>• Unlimited Repositories & PRs</li>
            <li className="text-brand">• Dedicated Vector Database</li>
            <li>• Fine-tuned Models on your codebase</li>
            <li>• On-Premise / VPC Deployment</li>
            <li>• Dedicated 24/7 Support SLA</li>
          </ul>
          <Button variant="secondary" className="w-full">Contact Sales</Button>
        </Card>

      </div>
    </div>
  );
}
