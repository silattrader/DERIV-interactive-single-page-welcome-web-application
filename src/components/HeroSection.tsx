import { ArrowRight } from 'lucide-react';
import { TradePreviewCard } from './TradePreviewCard';
import type { MarketOption } from '../data/derivContent';

interface HeroSectionProps {
  onOpenDemo: (marketId?: MarketOption['id']) => void;
}

export function HeroSection({ onOpenDemo }: HeroSectionProps) {
  return (
    <section className="pt-10 pb-16 sm:pt-14 sm:pb-24 border-b border-[#181C25]/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left column: 10-second clarity hook */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-medium text-[#181C25]/65 tracking-tight mb-4">
              <span>25+ Years of Trusted Online Trading</span>
              <span aria-hidden="true" className="mx-2 text-[#181C25]/30">
                ·
              </span>
              <span>3M+ Global Users</span>
            </p>

            <h1
              className="font-display font-bold text-[#181C25] tracking-[-0.025em] leading-[1.08] mb-5"
              style={{
                fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                textWrap: 'balance',
              }}
            >
              Trade Global Markets on Your Terms—With Built-In Risk Control.
            </h1>

            <p className="text-base sm:text-lg text-[#181C25]/75 leading-relaxed max-w-xl mb-8">
              Deriv is an all-in-one online trading platform where you can predict price movements on
              currencies, gold, stocks, crypto, and 24/7 synthetic markets—starting with a free
              practice account before risking a single cent.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
              <button
                type="button"
                onClick={() => onOpenDemo('gold')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] active:translate-y-px rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#181C25]"
              >
                <span>Practice Free with $10,000 Virtual Funds</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <a
                href="#investor-screener"
                className="inline-flex items-center justify-center px-5 py-3.5 text-sm sm:text-base font-semibold text-[#181C25] bg-[#FAF9F7] hover:bg-[#F1EFEA] border border-[#181C25]/12 rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                Find My Fit in 30 Seconds
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-[#181C25]/8 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <p className="font-mono tabular-nums text-lg font-semibold text-[#181C25]">$10,000</p>
                <p className="text-xs text-[#181C25]/60 mt-0.5">Free practice funds</p>
              </div>
              <div>
                <p className="font-mono tabular-nums text-lg font-semibold text-[#181C25]">$5</p>
                <p className="text-xs text-[#181C25]/60 mt-0.5">Optional real start</p>
              </div>
              <div>
                <p className="font-mono tabular-nums text-lg font-semibold text-[#181C25]">24/7</p>
                <p className="text-xs text-[#181C25]/60 mt-0.5">Derived indices open</p>
              </div>
            </div>
          </div>

          {/* Right column: Interactive How a Trade Works card */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <TradePreviewCard onOpenFullDemo={(marketId) => onOpenDemo(marketId)} />
          </div>
        </div>
      </div>
    </section>
  );
}
