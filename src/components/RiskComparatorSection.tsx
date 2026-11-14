import { useState } from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { MarketId } from '../data/derivContent';

interface RiskComparatorSectionProps {
  onOpenDemo: (marketId: MarketId) => void;
  onExploreRisk: () => void;
}

const STAKE_OPTIONS = [50, 100, 250, 500] as const;
const MULTIPLIER_OPTIONS = [5, 10, 20, 50] as const;
const SCENARIO_PRESETS = [
  { label: 'Flash Crash (-8%)', move: -8 },
  { label: 'Mild Dip (-2%)', move: -2 },
  { label: 'Steady Rally (+5%)', move: 5 },
  { label: 'Breakout (+12%)', move: 12 },
] as const;

export function RiskComparatorSection({
  onOpenDemo,
  onExploreRisk,
}: RiskComparatorSectionProps) {
  const [stake, setStake] = useState<number>(100);
  const [multiplier, setMultiplier] = useState<number>(20);
  const [marketMovePct, setMarketMovePct] = useState<number>(-8);
  const [stopLossRatio, setStopLossRatio] = useState<1 | 0.5>(1);

  const handleInteraction = () => {
    onExploreRisk();
  };

  // Raw uncapped P&L = stake * multiplier * (move% / 100)
  const rawPnl = Number((stake * multiplier * (marketMovePct / 100)).toFixed(2));
  const derivMaxLoss = -(stake * stopLossRatio);
  const derivPnl = Math.max(derivMaxLoss, rawPnl);
  const exceedsStake = rawPnl < -stake;

  // Build SVG Payoff Curve from -15% to +15%
  // Chart coordinate space: x in [45..555] (width 510), y in [20..200] (height 180)
  // Vertical range mapped to [-2 * stake, +2 * stake] for clean visual contrast
  const minDomainY = -stake * 2.5;
  const maxDomainY = stake * 2.5;

  const mapX = (pct: number) => 45 + ((pct + 15) / 30) * 510;
  const mapY = (val: number) => {
    const clamped = Math.max(minDomainY, Math.min(maxDomainY, val));
    return 200 - ((clamped - minDomainY) / (maxDomainY - minDomainY)) * 180;
  };

  const zeroY = mapY(0);
  const capFloorY = mapY(derivMaxLoss);

  const curveMoves = [-15, -12, -9, -6, -3, 0, 3, 6, 9, 12, 15];

  const uncappedPoints = curveMoves
    .map((m) => {
      const val = stake * multiplier * (m / 100);
      return `${mapX(m).toFixed(1)},${mapY(val).toFixed(1)}`;
    })
    .join(' ');

  const derivPoints = curveMoves
    .map((m) => {
      const val = Math.max(derivMaxLoss, stake * multiplier * (m / 100));
      return `${mapX(m).toFixed(1)},${mapY(val).toFixed(1)}`;
    })
    .join(' ');

  const markerX = mapX(marketMovePct);
  const markerUncappedY = mapY(rawPnl);
  const markerDerivY = mapY(derivPnl);

  return (
    <section
      id="risk-simulator"
      className="py-16 sm:py-24 bg-[#FAF9F7] border-b border-[#181C25]/8"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#FF444F] tracking-tight mb-2">
              Interactive Risk-Control Simulator
            </p>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#181C25] tracking-tight text-balance">
              See How Built-In Risk Caps Protect You in a Market Crash
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#181C25]/70 leading-relaxed">
              Drag the market shock slider into negative territory to compare traditional uncapped
              margin against Deriv Multipliers with zero-balance protection.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenDemo('gold')}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
          >
            <span>Test Capped-Risk Demo</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 5 cols: Interactive Controls */}
          <div className="lg:col-span-5 bg-white border border-[#181C25]/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-6">
              {/* Stake Picker */}
              <div>
                <p className="text-xs font-medium text-[#181C25]/65 mb-2">
                  1. Your chosen stake (deposit at risk)
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {STAKE_OPTIONS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setStake(val);
                        handleInteraction();
                      }}
                      className={`py-2 font-mono tabular-nums text-xs sm:text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                        stake === val
                          ? 'bg-[#181C25] text-white border-[#181C25]'
                          : 'bg-[#FAF9F7] text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier / Leverage Picker */}
              <div>
                <p className="text-xs font-medium text-[#181C25]/65 mb-2">
                  2. Amplification (Multiplier / Leverage)
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {MULTIPLIER_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMultiplier(m);
                        handleInteraction();
                      }}
                      className={`py-2 font-mono tabular-nums text-xs sm:text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                        multiplier === m
                          ? 'bg-[#181C25] text-white border-[#181C25]'
                          : 'bg-[#FAF9F7] text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                      }`}
                    >
                      x{m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Custom Stop-Loss */}
              <div>
                <p className="text-xs font-medium text-[#181C25]/65 mb-2">
                  3. Deriv Stop-Loss safety guard
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStopLossRatio(1);
                      handleInteraction();
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      stopLossRatio === 1
                        ? 'bg-[#181C25] text-white border-[#181C25]'
                        : 'bg-[#FAF9F7] text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                    }`}
                  >
                    Full Stake Cap (${stake})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStopLossRatio(0.5);
                      handleInteraction();
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      stopLossRatio === 0.5
                        ? 'bg-[#0D9488] text-white border-[#0D9488]'
                        : 'bg-[#FAF9F7] text-[#181C25] border-[#181C25]/12 hover:border-[#181C25]/35'
                    }`}
                  >
                    50% Stop-Loss (${(stake * 0.5).toFixed(0)})
                  </button>
                </div>
              </div>

              {/* Market Move Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="risk-shock-slider" className="text-xs font-medium text-[#181C25]/65">
                    4. Simulate market move
                  </label>
                  <span
                    className={`font-mono tabular-nums text-sm font-bold ${
                      marketMovePct >= 0 ? 'text-[#0D9488]' : 'text-[#FF444F]'
                    }`}
                  >
                    {marketMovePct > 0 ? `+${marketMovePct}%` : `${marketMovePct}%`}
                  </span>
                </div>

                <input
                  id="risk-shock-slider"
                  type="range"
                  min={-15}
                  max={15}
                  step={1}
                  value={marketMovePct}
                  onChange={(e) => {
                    setMarketMovePct(Number(e.target.value));
                    handleInteraction();
                  }}
                  className="w-full deriv-slider bg-[#E2E5EA] cursor-pointer"
                />

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {SCENARIO_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setMarketMovePct(preset.move);
                        handleInteraction();
                      }}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                        marketMovePct === preset.move
                          ? 'bg-[#181C25] text-white border-[#181C25]'
                          : 'bg-[#FAF9F7] text-[#181C25]/75 border-[#181C25]/12 hover:text-[#181C25]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right 7 cols: Live SVG Payoff Curve & Side-by-Side Outcome Readout */}
          <div className="lg:col-span-7 bg-white border border-[#181C25]/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-display font-bold text-[#181C25]">
                  Payoff Curve Across Market Moves (-15% to +15%)
                </h3>
                <div className="flex items-center gap-4 text-xs text-[#181C25]/70">
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true">
                      <line x1="0" y1="2" x2="14" y2="2" stroke="#0D9488" strokeWidth="3" />
                    </svg>
                    <span>Deriv Multipliers</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true">
                      <line
                        x1="0"
                        y1="2"
                        x2="14"
                        y2="2"
                        stroke="#FF444F"
                        strokeWidth="2"
                        strokeDasharray="3 2"
                      />
                    </svg>
                    <span>Uncapped Margin</span>
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 580 220"
                className="w-full h-52 bg-[#FAF9F7] border border-[#181C25]/8 rounded-xl"
                role="img"
                aria-label="Payoff comparison chart between uncapped margin and Deriv capped-risk multipliers"
              >
                {/* Danger zone below -stake */}
                <rect
                  x="45"
                  y={capFloorY}
                  width="510"
                  height={Math.max(0, 200 - capFloorY)}
                  fill="#FF444F"
                  fillOpacity="0.07"
                />

                {/* Zero break-even line */}
                <line
                  x1="45"
                  y1={zeroY}
                  x2="555"
                  y2={zeroY}
                  stroke="#181C25"
                  strokeOpacity="0.2"
                  strokeWidth="1"
                />
                <text x="10" y={zeroY + 4} fontSize="10" fill="#181C25" fillOpacity="0.55">
                  $0
                </text>

                {/* Max Loss Cap line */}
                <line
                  x1="45"
                  y1={capFloorY}
                  x2="555"
                  y2={capFloorY}
                  stroke="#0D9488"
                  strokeOpacity="0.45"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text x="54" y={capFloorY + 13} fontSize="10" fill="#0D9488" fontWeight="600">
                  Max loss floor: -${Math.abs(derivMaxLoss).toFixed(0)}
                </text>

                {/* Uncapped Margin diagonal */}
                <polyline
                  fill="none"
                  stroke="#FF444F"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  points={uncappedPoints}
                />

                {/* Deriv Capped Multipliers curve */}
                <polyline
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={derivPoints}
                />

                {/* Vertical marker for selected market move */}
                <line
                  x1={markerX}
                  y1="16"
                  x2={markerX}
                  y2="202"
                  stroke="#181C25"
                  strokeOpacity="0.28"
                  strokeWidth="1.2"
                />
                <circle cx={markerX} cy={markerUncappedY} r="4.5" fill="#FF444F" />
                <circle cx={markerX} cy={markerDerivY} r="5.5" fill="#0D9488" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Side-by-side Numeric Outcome Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#181C25]">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                    <span>Deriv Multipliers</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#0D9488]">Protected</span>
                </div>
                <p
                  className={`font-mono tabular-nums text-2xl font-bold ${
                    derivPnl >= 0 ? 'text-[#0D9488]' : 'text-[#181C25]'
                  }`}
                >
                  {derivPnl >= 0
                    ? `+$${derivPnl.toFixed(2)}`
                    : `-$${Math.abs(derivPnl).toFixed(2)}`}
                </p>
                <p className="text-xs text-[#181C25]/65">
                  {derivPnl === derivMaxLoss
                    ? `Trade stopped automatically at your $${Math.abs(derivMaxLoss).toFixed(0)} risk limit.`
                    : derivPnl >= 0
                    ? `Full x${multiplier} upside captured on a +${marketMovePct}% move.`
                    : 'Inside your pre-defined stake buffer.'}
                </p>
              </div>

              <div className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#181C25]">
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#FF444F]" />
                    <span>Traditional Uncapped Margin</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#FF444F]">
                    {exceedsStake ? 'Negative Balance Risk' : 'No Auto-Cap'}
                  </span>
                </div>
                <p
                  className={`font-mono tabular-nums text-2xl font-bold ${
                    rawPnl >= 0 ? 'text-[#0D9488]' : 'text-[#FF444F]'
                  }`}
                >
                  {rawPnl >= 0 ? `+$${rawPnl.toFixed(2)}` : `-$${Math.abs(rawPnl).toFixed(2)}`}
                </p>
                <p className="text-xs text-[#181C25]/65">
                  {exceedsStake
                    ? `Loss exceeds your $${stake} deposit by $${Math.abs(rawPnl + stake).toFixed(2)} during a sudden gap.`
                    : rawPnl >= 0
                    ? 'Matches upside, but carries unlimited downside risk without protection.'
                    : 'Loss continues growing if the market falls further.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
