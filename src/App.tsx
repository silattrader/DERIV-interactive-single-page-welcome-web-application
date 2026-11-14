import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { WhatItDoesSection } from './components/WhatItDoesSection';
import { RiskComparatorSection } from './components/RiskComparatorSection';
import { InvestorFunnelSection } from './components/InvestorFunnelSection';
import { WhoIsItForSection } from './components/WhoIsItForSection';
import { AiGuideSection, type ChatRole } from './components/AiGuideSection';
import { OnboardingFooter, type ReadinessMilestones } from './components/OnboardingFooter';
import { DemoPreviewModal } from './components/DemoPreviewModal';
import type { MarketId } from './data/derivContent';

export default function App() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoMarketId, setDemoMarketId] = useState<MarketId>('gold');
  const [queuedPrompt, setQueuedPrompt] = useState<{
    id: number;
    text: string;
    role?: ChatRole;
  } | null>(null);

  const [milestones, setMilestones] = useState<ReadinessMilestones>({
    exploredRisk: false,
    builtWatchlist: true,
    testedDemo: false,
    consultedGuide: false,
  });

  const markMilestone = (key: keyof ReadinessMilestones) => {
    setMilestones((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleOpenDemo = (marketId: MarketId = 'gold') => {
    setDemoMarketId(marketId);
    setDemoModalOpen(true);
    markMilestone('testedDemo');
  };

  const handleAskAiAboutFit = (promptText: string) => {
    setQueuedPrompt({
      id: Date.now(),
      text: promptText,
      role: 'strategist',
    });
    markMilestone('consultedGuide');
    const el = document.getElementById('ai-guide');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#181C25]">
      <Navbar onOpenDemo={() => handleOpenDemo('gold')} />

      <main className="flex-1">
        <HeroSection onOpenDemo={handleOpenDemo} />
        <WhatItDoesSection />
        <RiskComparatorSection
          onOpenDemo={handleOpenDemo}
          onExploreRisk={() => markMilestone('exploredRisk')}
        />
        <InvestorFunnelSection
          onOpenDemo={handleOpenDemo}
          onAskAiAboutFit={handleAskAiAboutFit}
        />
        <WhoIsItForSection onOpenDemo={handleOpenDemo} />
        <AiGuideSection
          onOpenDemo={() => handleOpenDemo('volatility75')}
          queuedPrompt={queuedPrompt}
          onConsultGuide={() => markMilestone('consultedGuide')}
        />
        <OnboardingFooter
          onOpenDemo={() => handleOpenDemo('gold')}
          milestones={milestones}
        />
      </main>

      <DemoPreviewModal
        isOpen={demoModalOpen}
        initialMarketId={demoMarketId}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
