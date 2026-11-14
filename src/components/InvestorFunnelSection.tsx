import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Layers,
  Play,
  RotateCcw,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ASSET_CLASSES, type AssetClassItem, type MarketId } from '../data/derivContent';

interface InvestorFunnelSectionProps {
  onOpenDemo: (marketId: MarketId) => void;
  onAskAiAboutFit: (promptText: string) => void;
}

type HorizonChoice = 'long-term' | 'short-term';
type CadenceChoice = 'steady' | 'active';
type RiskStyleChoice = 'gradual' | 'capped';

interface FunnelVerdict {
  profileType: 'Long-Term Investor' | 'Short-Term Trader' | 'Hybrid Strategy Investor';
  summary: string;
  recommendedPlatform: string;
  recommendedInstrument: string;
  whyItFits: string;
  nextStepLabel: string;
}

function getFunnelVerdict(
  horizon: HorizonChoice,
  cadence: CadenceChoice,
  riskStyle: RiskStyleChoice,
  selectedAssets: AssetClassItem[],
): FunnelVerdict {
  const longScore =
    (horizon === 'long-term' ? 2 : 0) +
    (cadence === 'steady' ? 1 : 0) +
    (riskStyle === 'gradual' ? 1 : 0);

  const assetNames = selectedAssets.map((a) => a.name).join(', ');

  if (longScore >= 3) {
    return {
      profileType: 'Long-Term Investor',
      summary: `You prefer holding positions across weeks or months rather than watching minute-by-minute price ticks. Your focus fits broader trends across ${assetNames}.`,
      recommendedPlatform: 'Deriv MT5 or Deriv cTrader (Swap-free CFD accounts)',
      recommendedInstrument: 'Longer-term CFDs with preset Stop-Loss & Take-Profit',
      whyItFits:
        'Hold positions in Gold, Global Stock Indices, or Crypto without overnight swap surprises on swap-free accounts, and let trades play out calmly.',
      nextStepLabel: 'Practice Long-Term Positions in $10,000 Demo',
    };
  }

  if (longScore <= 1) {
    return {
      profileType: 'Short-Term Trader',
      summary: `You prefer faster, defined-duration trades where you capture daily or hourly moves in ${assetNames} and know your exact maximum risk upfront.`,
      recommendedPlatform: 'Deriv Trader (web) or Deriv GO (mobile app)',
      recommendedInstrument: 'Capped-Risk Multipliers & Options',
      whyItFits:
        'Your maximum possible loss is strictly capped at your chosen stake before you enter, making short-term swings in Gold, Crypto, Forex, or 24/7 Indices predictable to manage.',
      nextStepLabel: 'Test Capped-Risk Short-Term Trades in $10,000 Demo',
    };
  }

  return {
    profileType: 'Hybrid Strategy Investor',
    summary: `You combine a patient outlook with active opportunities—ideal for pairing steady trend positions with smaller capped-risk trades across ${assetNames}.`,
    recommendedPlatform: 'Deriv Trader + Deriv MT5 under one unified account',
    recommendedInstrument: 'Multipliers for short swings + CFDs for multi-week holds',
    whyItFits:
      'Use one Deriv login to separate longer-term Gold or Stock positions from quick, stake-capped trades when markets move.',
    nextStepLabel: 'Explore Both Modes in $10,000 Demo',
  };
}

export function InvestorFunnelSection({
  onOpenDemo,
  onAskAiAboutFit,
}: InvestorFunnelSectionProps) {
  const [horizon, setHorizon] = useState<HorizonChoice | null>('long-term');
  const [cadence, setCadence] = useState<CadenceChoice | null>('steady');
  const [riskStyle, setRiskStyle] = useState<RiskStyleChoice | null>('gradual');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([
    'forex',
    'crypto',
    'derived-indices',
    'stocks-indices',
  ]);
  const [assetFilter, setAssetFilter] = useState<'all' | 'long-term' | 'short-term'>('all');

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev;
      }
      return [...prev, id];
    });
  };

  const resetFunnel = () => {
    setHorizon(null);
    setCadence(null);
    setRiskStyle(null);
    setSelectedAssetIds(['forex', 'crypto', 'derived-indices', 'stocks-indices']);
  };

  const applyPreset = (ids: string[]) => {
    setSelectedAssetIds(ids);
  };

  const filteredAssets = ASSET_CLASSES.filter((asset) => {
    if (assetFilter === 'all') return true;
    return asset.bestFor === assetFilter || asset.bestFor === 'both';
  });

  const selectedAssets = ASSET_CLASSES.filter((a) => selectedAssetIds.includes(a.id));
  const primaryDemoMarket: MarketId = selectedAssets[0]?.demoMarketId ?? 'gold';
  const isComplete = horizon !== null && cadence !== null && riskStyle !== null;

  const verdict = isComplete
    ? getFunnelVerdict(horizon, cadence, riskStyle, selectedAssets)
    : null;

  const answeredCount = [horizon, cadence, riskStyle].filter(Boolean).length;

  // Compute personalized weights for the Portfolio Builder (tilting slightly toward horizon fit)
  const rawWeights = selectedAssets.map((asset) => {
    let weight = 1;
    if (verdict?.profileType === 'Long-Term Investor') {
      weight = asset.bestFor === 'long-term' ? 1.5 : asset.bestFor === 'both' ? 1.2 : 0.8;
    } else if (verdict?.profileType === 'Short-Term Trader') {
      weight = asset.bestFor === 'short-term' ? 1.5 : asset.bestFor === 'both' ? 1.2 : 0.8;
    }
    return { asset, weight };
  });

  const totalWeight = rawWeights.reduce((acc, item) => acc + item.weight, 0) || 1;
  const allocations = rawWeights.map((item, idx) => {
    const exactPct = (item.weight / totalWeight) * 100;
    const roundedPct =
      idx === rawWeights.length - 1
        ? 100 -
          rawWeights
            .slice(0, idx)
            .reduce((sum, prev) => sum + Math.round((prev.weight / totalWeight) * 100), 0)
        : Math.round(exactPct);
    const virtualAmount = Math.round((roundedPct / 100) * 10000);
    return {
      asset: item.asset,
      pct: roundedPct,
      virtualAmount,
    };
  });

  let cumulativeX = 0;
  const svgSegments = allocations.map((item) => {
    const width = (item.pct / 100) * 600;
    const seg = {
      id: item.asset.id,
      x: cumulativeX,
      width,
      color: item.asset.colorHex,
      label: `${item.asset.shortCategory} ${item.pct}%`,
    };
    cumulativeX += width;
    return seg;
  });

  const suggestedInstrumentForAsset = (asset: AssetClassItem): string => {
    if (verdict?.profileType === 'Long-Term Investor') {
      return asset.bestFor === 'short-term' ? 'Capped Multiplier' : 'Swap-Free CFD';
    }
    if (verdict?.profileType === 'Short-Term Trader') {
      return 'Capped-Risk Multiplier';
    }
    return asset.bestFor === 'long-term' ? 'Longer-Term CFD' : 'Multiplier / Option';
  };

  return (
    <section id="investor-screener" className="py-16 sm:py-24 bg-white border-b border-[#181C25]/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-14">
        {/* Part A: Long-Term Investor vs Short-Term Trader Screening Funnel */}
        <div className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-2xl p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#181C25]/10 mb-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#FF444F] tracking-tight mb-2">
                Investor vs. Trader Screening Funnel
              </p>
              <h2
                className="text-2xl sm:text-3xl font-display font-bold text-[#181C25] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Are You a Long-Term Investor or a Short-Term Trader?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#181C25]/70">
                Answer three quick questions and pick the asset classes you care about to get your
                personalized Deriv starting setup.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <span className="font-mono tabular-nums text-xs font-medium text-[#181C25]/60">
                {answeredCount} of 3 answered
              </span>
              <button
                type="button"
                onClick={resetFunnel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#181C25]/75 hover:text-[#181C25] bg-white border border-[#181C25]/12 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 columns: 3 Screening Questions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Question 1 */}
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-[#181C25]">
                  <span className="font-mono tabular-nums text-[#FF444F] mr-2">01.</span>
                  How long do you usually plan to hold a position?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    aria-pressed={horizon === 'long-term'}
                    onClick={() => setHorizon('long-term')}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                      horizon === 'long-term'
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-white text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span>Weeks to Months</span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        horizon === 'long-term' ? 'text-white/75' : 'text-[#181C25]/65'
                      }`}
                    >
                      Long-term investor style—follow steady macro or asset growth trends.
                    </p>
                  </button>

                  <button
                    type="button"
                    aria-pressed={horizon === 'short-term'}
                    onClick={() => setHorizon('short-term')}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                      horizon === 'short-term'
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-white text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>Minutes to a Few Days</span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        horizon === 'short-term' ? 'text-white/75' : 'text-[#181C25]/65'
                      }`}
                    >
                      Short-term trader style—capture daily or hourly price swings.
                    </p>
                  </button>
                </div>
              </div>

              {/* Question 2 */}
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-[#181C25]">
                  <span className="font-mono tabular-nums text-[#FF444F] mr-2">02.</span>
                  How often do you want to check the markets?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    aria-pressed={cadence === 'steady'}
                    onClick={() => setCadence('steady')}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                      cadence === 'steady'
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-white text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">Once or twice a week</div>
                    <p
                      className={`text-xs leading-relaxed ${
                        cadence === 'steady' ? 'text-white/75' : 'text-[#181C25]/65'
                      }`}
                    >
                      Set automatic limits and review calmly without watching screens all day.
                    </p>
                  </button>

                  <button
                    type="button"
                    aria-pressed={cadence === 'active'}
                    onClick={() => setCadence('active')}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                      cadence === 'active'
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-white text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">Daily or weekend sessions</div>
                    <p
                      className={`text-xs leading-relaxed ${
                        cadence === 'active' ? 'text-white/75' : 'text-[#181C25]/65'
                      }`}
                    >
                      Spot active setups on desktop or mobile whenever you have 15 minutes.
                    </p>
                  </button>
                </div>
              </div>

              {/* Question 3 */}
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-[#181C25]">
                  <span className="font-mono tabular-nums text-[#FF444F] mr-2">03.</span>
                  Which risk preference feels right to you?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    aria-pressed={riskStyle === 'gradual'}
                    onClick={() => setRiskStyle('gradual')}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                      riskStyle === 'gradual'
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-white text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">Gradual trend exposure</div>
                    <p
                      className={`text-xs leading-relaxed ${
                        riskStyle === 'gradual' ? 'text-white/75' : 'text-[#181C25]/65'
                      }`}
                    >
                      Mirror overall market direction using standard stop-loss targets.
                    </p>
                  </button>

                  <button
                    type="button"
                    aria-pressed={riskStyle === 'capped'}
                    onClick={() => setRiskStyle('capped')}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                      riskStyle === 'capped'
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-white text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">Strictly capped per-trade stake</div>
                    <p
                      className={`text-xs leading-relaxed ${
                        riskStyle === 'capped' ? 'text-white/75' : 'text-[#181C25]/65'
                      }`}
                    >
                      Lock in the exact dollar maximum you can lose before opening a trade.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 columns: Live Screening Verdict Card */}
            <div className="lg:col-span-5 bg-white border border-[#181C25]/12 rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
              {verdict ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-[#FF444F]">
                        Your Screening Result
                      </p>
                      <h3 className="text-2xl font-display font-bold text-[#181C25] tracking-tight mt-1">
                        {verdict.profileType}
                      </h3>
                    </div>

                    <p className="text-sm text-[#181C25]/75 leading-relaxed">
                      {verdict.summary}
                    </p>

                    <dl className="divide-y divide-[#181C25]/8 border-y border-[#181C25]/8">
                      <div className="py-3">
                        <dt className="text-xs font-medium text-[#181C25]/55">
                          Recommended platform
                        </dt>
                        <dd className="text-sm font-semibold text-[#181C25] mt-0.5">
                          {verdict.recommendedPlatform}
                        </dd>
                      </div>
                      <div className="py-3">
                        <dt className="text-xs font-medium text-[#181C25]/55">
                          Best-fit instruments
                        </dt>
                        <dd className="text-sm font-semibold text-[#181C25] mt-0.5">
                          {verdict.recommendedInstrument}
                        </dd>
                      </div>
                      <div className="py-3">
                        <dt className="text-xs font-medium text-[#181C25]/55">
                          Selected asset classes ({selectedAssets.length})
                        </dt>
                        <dd className="text-sm text-[#181C25] mt-0.5">
                          {selectedAssets.map((a) => a.name).join(' · ')}
                        </dd>
                      </div>
                    </dl>

                    <p className="text-xs text-[#181C25]/65 leading-relaxed">
                      {verdict.whyItFits}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenDemo(primaryDemoMarket)}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] rounded-xl transition-colors duration-150 cursor-pointer"
                    >
                      <span>{verdict.nextStepLabel}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onAskAiAboutFit(
                          `I screened as a ${verdict.profileType} interested in ${selectedAssets
                            .map((a) => a.name)
                            .join(', ')}. What is moving these markets right now, and how should I test them safely on a Deriv demo?`,
                        )
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#181C25] bg-[#FAF9F7] hover:bg-[#F1EFEA] border border-[#181C25]/12 rounded-xl transition-colors duration-150 cursor-pointer"
                    >
                      <span>Ask AI Guide + Check Live Market News</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <Clock className="w-8 h-8 text-[#181C25]/35 mx-auto" />
                  <h3 className="text-lg font-display font-bold text-[#181C25]">
                    Complete All 3 Questions
                  </h3>
                  <p className="text-sm text-[#181C25]/65 max-w-xs mx-auto">
                    Select your preferred holding time, weekly check-in cadence, and risk style on
                    the left to reveal whether Long-Term Investing or Short-Term Trading fits you
                    best.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Part B: Visual Portfolio Builder & Personalized Watchlist Recommendation */}
        <div className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-2xl p-6 sm:p-10 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#181C25]/10">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#FF444F] tracking-tight mb-2">
                Visual Portfolio Builder
              </p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#181C25] tracking-tight text-balance">
                Build Your Personalized Asset Watchlist
              </h3>
              <p className="mt-2 text-sm sm:text-base text-[#181C25]/70">
                Toggle interest across Forex, Crypto, Synthetic Indices, Stocks, and Commodities to
                preview how your $10,000 practice watchlist could be organized.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => applyPreset(['forex', 'crypto', 'derived-indices', 'stocks-indices'])}
                className="px-3 py-1.5 text-xs font-semibold text-[#181C25] bg-white hover:bg-[#F1EFEA] border border-[#181C25]/12 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Balanced 4-Asset Mix
              </button>
              <button
                type="button"
                onClick={() => applyPreset(['crypto', 'derived-indices'])}
                className="px-3 py-1.5 text-xs font-semibold text-[#181C25] bg-white hover:bg-[#F1EFEA] border border-[#181C25]/12 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                24/7 Weekend Focus
              </button>
              <button
                type="button"
                onClick={() => applyPreset(['stocks-indices', 'gold-commodities', 'crypto'])}
                className="px-3 py-1.5 text-xs font-semibold text-[#181C25] bg-white hover:bg-[#F1EFEA] border border-[#181C25]/12 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Long-Term Core
              </button>
            </div>
          </div>

          {/* Interactive Interest Toggles */}
          <div>
            <p className="text-xs font-medium text-[#181C25]/60 mb-3">
              Toggle your asset class interests ({selectedAssets.length} active)
            </p>
            <div className="flex flex-wrap gap-2.5">
              {ASSET_CLASSES.map((asset) => {
                const active = selectedAssetIds.includes(asset.id);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleAsset(asset.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-white text-[#181C25] border-[#181C25]/15 hover:border-[#181C25]/40'
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                      <rect
                        width="10"
                        height="10"
                        rx="2"
                        fill={active ? '#FF444F' : asset.colorHex}
                      />
                    </svg>
                    <span>{asset.shortCategory}</span>
                    {active && <Check className="w-3.5 h-3.5 text-white/85 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Allocation Bar + Legend */}
          <div className="bg-white border border-[#181C25]/10 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#181C25]">
                <Layers className="w-4 h-4 text-[#FF444F] shrink-0" />
                <span>
                  Suggested Practice Allocation
                  {verdict ? ` · Tailored for ${verdict.profileType}` : ''}
                </span>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-[#181C25]/70">
                $10,000.00 Virtual Demo Split
              </span>
            </div>

            <svg
              viewBox="0 0 600 18"
              className="w-full h-4 rounded-lg overflow-hidden"
              role="img"
              aria-label="Visual allocation split across selected asset classes"
            >
              {svgSegments.map((seg) => (
                <rect
                  key={seg.id}
                  x={seg.x}
                  y="0"
                  width={Math.max(0, seg.width)}
                  height="18"
                  fill={seg.color}
                >
                  <title>{seg.label}</title>
                </rect>
              ))}
            </svg>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
              {allocations.map(({ asset, pct, virtualAmount }) => (
                <div key={asset.id} className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181C25]">
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
                      <rect width="8" height="8" rx="2" fill={asset.colorHex} />
                    </svg>
                    <span className="truncate">{asset.shortCategory}</span>
                  </div>
                  <p className="font-mono tabular-nums text-xs text-[#181C25]/65">
                    {pct}% · ${virtualAmount.toLocaleString('en-US')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Personalized Watchlist Recommendation Table */}
          <div className="bg-white border border-[#181C25]/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#181C25]/8 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-display font-bold text-[#181C25]">
                  Recommended Starter Watchlist ({selectedAssets.length} Asset{' '}
                  {selectedAssets.length === 1 ? 'Class' : 'Classes'})
                </h4>
                <p className="text-xs text-[#181C25]/60">
                  Matched to your toggled interests—click Practice on any instrument to test it in
                  the live sandbox.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAskAiAboutFit(
                    `Explain how to balance a starter watchlist across ${selectedAssets
                      .map((a) => a.shortCategory)
                      .join(', ')} as a ${verdict?.profileType ?? 'beginner'} with built-in risk caps.`,
                  )
                }
                className="text-xs font-semibold text-[#FF444F] hover:text-[#E03640] cursor-pointer whitespace-nowrap"
              >
                Ask AI Guide to explain this mix →
              </button>
            </div>

            <div className="divide-y divide-[#181C25]/8">
              {allocations.flatMap(({ asset, pct }) =>
                asset.watchlistInstruments.map((inst, instIdx) => (
                  <div
                    key={`${asset.id}-${inst.symbol}`}
                    className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F7]/70 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono tabular-nums text-sm font-bold text-[#181C25]">
                          {inst.symbol}
                        </span>
                        <span className="text-xs text-[#181C25]/55">
                          {inst.label} · {asset.shortCategory}
                        </span>
                      </div>
                      <p className="text-xs text-[#181C25]/70">{inst.roleNote}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold text-[#181C25]">
                          {suggestedInstrumentForAsset(asset)}
                        </p>
                        <p className="font-mono tabular-nums text-[11px] text-[#181C25]/55">
                          {instIdx === 0 ? `${pct}% class focus` : asset.hours}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenDemo(inst.demoMarketId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#181C25] bg-[#FAF9F7] hover:bg-[#181C25] hover:text-white border border-[#181C25]/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-3 h-3 shrink-0" />
                        <span>Practice</span>
                      </button>
                    </div>
                  </div>
                )),
              )}
            </div>
          </div>
        </div>

        {/* Part C: Interactive Investment Asset Classes Explorer */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#FF444F] tracking-tight mb-2">
                Asset Class Directory
              </p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#181C25] tracking-tight text-balance">
                Explore Investment Asset Classes on Deriv
              </h3>
              <p className="mt-2 text-sm sm:text-base text-[#181C25]/70">
                Inspect market hours and plain-English descriptions for each asset class—selections
                sync automatically with your Portfolio Builder above.
              </p>
            </div>

            {/* Interactive Horizon Filter */}
            <div
              role="group"
              aria-label="Filter asset classes by trading horizon"
              className="flex items-center gap-1 p-1 bg-[#FAF9F7] border border-[#181C25]/10 rounded-xl self-start md:self-auto"
            >
              {(
                [
                  { id: 'all', label: 'All Assets' },
                  { id: 'long-term', label: 'Long-Term Fit' },
                  { id: 'short-term', label: 'Short-Term Fit' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAssetFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    assetFilter === tab.id
                      ? 'bg-[#181C25] text-white'
                      : 'text-[#181C25]/70 hover:text-[#181C25]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAssetIds.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleAsset(asset.id)}
                  className={`text-left rounded-2xl p-6 border transition-all duration-150 flex flex-col justify-between gap-5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF9F7] border-[#181C25] ring-1 ring-[#181C25]'
                      : 'bg-white border-[#181C25]/10 hover:border-[#181C25]/35'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-lg font-display font-bold text-[#181C25] tracking-tight">
                        {asset.name}
                      </h4>
                      <span
                        aria-hidden="true"
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-[#FF444F] border-[#FF444F] text-white'
                            : 'bg-white border-[#181C25]/20 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <p className="text-xs font-medium text-[#181C25]/55 mb-3">
                      {asset.examples}
                    </p>

                    <p className="text-sm text-[#181C25]/75 leading-relaxed">
                      {asset.plainDescription}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-[#181C25]/8 flex flex-wrap items-center justify-between gap-2 text-xs text-[#181C25]/60">
                    <span>{asset.bestForLabel}</span>
                    <span className="font-mono tabular-nums">{asset.hours}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
