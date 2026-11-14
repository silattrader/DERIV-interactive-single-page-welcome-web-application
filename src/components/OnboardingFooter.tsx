import { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Copy, ShieldAlert } from 'lucide-react';
import { ONBOARDING_STEPS } from '../data/derivContent';

export interface ReadinessMilestones {
  exploredRisk: boolean;
  builtWatchlist: boolean;
  testedDemo: boolean;
  consultedGuide: boolean;
}

interface OnboardingFooterProps {
  onOpenDemo: () => void;
  milestones: ReadinessMilestones;
}

const MILESTONE_ITEMS: Array<{
  key: keyof ReadinessMilestones;
  label: string;
  href: string;
}> = [
  { key: 'exploredRisk', label: 'Tested risk-cap simulator', href: '#risk-simulator' },
  { key: 'builtWatchlist', label: 'Screened style & asset watchlist', href: '#investor-screener' },
  { key: 'consultedGuide', label: 'Asked plain-English AI or voice guide', href: '#ai-guide' },
  { key: 'testedDemo', label: 'Previewed $10,000 virtual demo', href: '#start-free-demo' },
];

export function OnboardingFooter({ onOpenDemo, milestones }: OnboardingFooterProps) {
  const [copied, setCopied] = useState(false);

  const completedCount = Object.values(milestones).filter(Boolean).length;

  const handleCopyBlueprint = async () => {
    const blueprint = [
      'Deriv Starter Onboarding Blueprint',
      '----------------------------------',
      '1. Start Risk-Free: $10,000 virtual demo account (no deposit required)',
      '2. Built-In Risk Control: Use Multipliers or Options to cap maximum loss at your chosen stake',
      '3. Asset Watchlist: Explore Forex, Crypto, 24/7 Synthetic Indices, Stocks & Gold',
      '4. Real-Money Rule: Only switch to a real account (from $5) after completing practice sessions',
      'Risk Note: Trading involves risk. Never trade money you cannot afford to lose.',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(blueprint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <section id="start-free-demo" className="py-16 sm:py-24 bg-white border-b border-[#181C25]/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Interactive First-Visit Readiness Strip */}
          <div className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#FF444F]">Your First-Visit Progress</p>
                <h3 className="text-lg sm:text-xl font-display font-bold text-[#181C25] tracking-tight mt-0.5">
                  <span className="font-mono tabular-nums">{completedCount}</span> of 4 core
                  concepts explored
                </h3>
              </div>

              <button
                type="button"
                onClick={() => void handleCopyBlueprint()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#181C25] bg-white hover:bg-[#F1EFEA] border border-[#181C25]/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>Starter Blueprint Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Starter Blueprint</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MILESTONE_ITEMS.map((item) => {
                const done = milestones[item.key];
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-xs font-medium transition-colors ${
                      done
                        ? 'bg-white border-[#0D9488]/40 text-[#181C25]'
                        : 'bg-white/60 border-[#181C25]/10 text-[#181C25]/65 hover:text-[#181C25]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        done
                          ? 'bg-[#0D9488] border-[#0D9488] text-white'
                          : 'bg-white border-[#181C25]/20 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-xl">
                <p className="text-xs font-medium text-[#FF444F] tracking-tight mb-2">
                  Clear Next Steps
                </p>
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#181C25] tracking-tight text-balance">
                  What You Can Do Next
                </h2>
              </div>

              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
              >
                <span>Start Free $10,000 Demo</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ONBOARDING_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-4"
                >
                  <div>
                    <span className="font-mono tabular-nums text-sm font-semibold text-[#FF444F]">
                      Step {item.step}
                    </span>
                    <h3 className="text-lg font-display font-bold text-[#181C25] tracking-tight mt-2 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#181C25]/70 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#181C25] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/12">
            <div className="flex items-center gap-2.5 font-display font-bold text-lg tracking-tight">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M4 3H12.5C17.1944 3 21 6.80558 21 11.5V12.5C21 17.1944 17.1944 21 12.5 21H4V3Z"
                  fill="#FF444F"
                />
                <path
                  d="M8.5 7.5H12.2C14.851 7.5 17 9.64903 17 12.3C17 14.951 14.851 17.1 12.2 17.1H8.5V7.5Z"
                  fill="#FFFFFF"
                />
              </svg>
              <span>Deriv</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/80">
              <span>Zero-balance protection</span>
              <span aria-hidden="true" className="text-white/30">
                ·
              </span>
              <span>24/7 support</span>
              <span aria-hidden="true" className="text-white/30">
                ·
              </span>
              <span>25+ years operating history</span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-white/75 leading-relaxed max-w-4xl">
            <ShieldAlert className="w-4 h-4 text-[#FF444F] shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold text-white">Risk transparency:</strong> Trading
              involves risk. Always practice with a demo account first and never trade money you
              cannot afford to lose.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
            <span>Deriv Welcome Guide · Designed for first-time clarity</span>
            <div className="flex items-center gap-6">
              <a href="#what-it-does" className="hover:text-white transition-colors">
                What It Does
              </a>
              <a href="#who-its-for" className="hover:text-white transition-colors">
                Who It&apos;s For
              </a>
              <a href="#start-free-demo" className="hover:text-white transition-colors">
                Start Free Demo
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
