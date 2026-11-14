import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { MARKET_OPTIONS, type MarketOption } from '../data/derivContent';

interface TradePreviewCardProps {
  onOpenFullDemo: (marketId: MarketOption['id']) => void;
}

type Direction = 'up' | 'down';

const UP_PATH = 'M 10 86 L 52 78 L 94 82 L 138 66 L 182 58 L 226 42 L 270 26';
const DOWN_PATH = 'M 10 34 L 52 40 L 94 36 L 138 54 L 182 64 L 226 76 L 270 90';
const BASELINE_Y = 60;

export function TradePreviewCard({ onOpenFullDemo }: TradePreviewCardProps) {
  const [selectedMarketId, setSelectedMarketId] = useState<MarketOption['id']>('gold');
  const [direction, setDirection] = useState<Direction>('up');
  const [stake, setStake] = useState<number>(25);
  const [simState, setSimState] = useState<'idle' | 'running' | 'settled'>('idle');
  const [simWon, setSimWon] = useState<boolean>(true);

  const market = MARKET_OPTIONS.find((m) => m.id === selectedMarketId) ?? MARKET_OPTIONS[0];
  const potentialReturn = (stake * market.payoutMultiplier).toFixed(2);
  const potentialProfit = (stake * (market.payoutMultiplier - 1)).toFixed(2);
  const sliderPct = ((stake - 10) / (100 - 10)) * 100;

  useEffect(() => {
    if (simState !== 'running') return;
    const timer = window.setTimeout(() => {
      // Alternate deterministically or based on current stake parity so visitors can experience both capped loss and payout
      const won = stake % 15 !== 0;
      setSimWon(won);
      setSimState('settled');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [simState, stake]);

  const handleRunSimulation = () => {
    setSimState('running');
  };

  const handleReset = () => {
    setSimState('idle');
  };

  return (
    <div className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#181C25]/60">Interactive 10-second preview</p>
          <h2 className="text-lg font-display font-bold text-[#181C25] tracking-tight">
            How a Trade Works
          </h2>
        </div>

        <div
          role="group"
          aria-label="Choose example market"
          className="flex flex-wrap items-center gap-1 p-1 bg-white border border-[#181C25]/10 rounded-lg"
        >
          {MARKET_OPTIONS.map((item) => {
            const active = item.id === selectedMarketId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedMarketId(item.id);
                  setSimState('idle');
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#181C25] text-white'
                    : 'text-[#181C25]/70 hover:text-[#181C25]'
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Simplified Visual Path */}
      <div className="bg-white border border-[#181C25]/8 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-[#181C25]/65 mb-2">
          <span className="font-medium text-[#181C25]">{market.name}</span>
          <span className="font-mono tabular-nums">
            Entry {market.basePrice.toFixed(market.decimals)}
          </span>
        </div>

        <svg
          viewBox="0 0 280 110"
          className="w-full h-24 overflow-visible"
          role="img"
          aria-label={`Simplified price path showing ${direction === 'up' ? 'upward' : 'downward'} prediction`}
        >
          <line
            x1="10"
            y1={BASELINE_Y}
            x2="270"
            y2={BASELINE_Y}
            stroke="#181C25"
            strokeOpacity="0.14"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text x="12" y={BASELINE_Y - 6} fontSize="10" fill="#181C25" fillOpacity="0.5">
            Your starting price
          </text>

          <path
            d={direction === 'up' ? UP_PATH : DOWN_PATH}
            fill="none"
            stroke={direction === 'up' ? '#0D9488' : '#FF444F'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle
            cx="270"
            cy={direction === 'up' ? 26 : 90}
            r="4.5"
            fill={direction === 'up' ? '#0D9488' : '#FF444F'}
          />
        </svg>

        <p className="text-xs text-[#181C25]/65 mt-1">{market.description}</p>
      </div>

      {/* Step 1: Direction Toggle */}
      <div>
        <span className="block text-xs font-medium text-[#181C25]/70 mb-2">
          1. Pick a direction
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDirection('up');
              setSimState('idle');
            }}
            aria-pressed={direction === 'up'}
            className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
              direction === 'up'
                ? 'bg-[#0D9488] text-white border-[#0D9488]'
                : 'bg-white text-[#181C25] border-[#181C25]/15 hover:border-[#181C25]/35'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            <span>Price Goes Up</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDirection('down');
              setSimState('idle');
            }}
            aria-pressed={direction === 'down'}
            className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
              direction === 'down'
                ? 'bg-[#FF444F] text-white border-[#FF444F]'
                : 'bg-white text-[#181C25] border-[#181C25]/15 hover:border-[#181C25]/35'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 shrink-0" />
            <span>Price Goes Down</span>
          </button>
        </div>
      </div>

      {/* Step 2: Adjustable Stake Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="hero-stake-slider" className="text-xs font-medium text-[#181C25]/70">
            2. Choose your stake
          </label>
          <span className="font-mono tabular-nums text-base font-semibold text-[#181C25]">
            ${stake}.00
          </span>
        </div>

        <input
          id="hero-stake-slider"
          type="range"
          min={10}
          max={100}
          step={5}
          value={stake}
          onChange={(e) => {
            setStake(Number(e.target.value));
            setSimState('idle');
          }}
          style={{
            background: `linear-gradient(to right, #FF444F 0%, #FF444F ${sliderPct}%, #E2E5EA ${sliderPct}%, #E2E5EA 100%)`,
          }}
          className="w-full deriv-slider cursor-pointer"
        />

        <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#181C25]/50 mt-1.5">
          <span>$10</span>
          <span>$50</span>
          <span>$100</span>
        </div>
      </div>

      {/* Clear Risk Cap Readout */}
      <div className="bg-white border border-[#181C25]/10 rounded-xl p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#181C25]">
            <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0" />
            <span>Maximum Potential Loss: Capped at Your Stake</span>
          </div>
          <span className="font-mono tabular-nums text-sm font-semibold text-[#181C25] shrink-0">
            ${stake}.00
          </span>
        </div>

        <div className="pt-2 border-t border-[#181C25]/8 flex items-center justify-between text-xs text-[#181C25]/70">
          <span>Estimated payout if your prediction is right</span>
          <span className="font-mono tabular-nums font-semibold text-[#0D9488]">
            ${potentialReturn} (+${potentialProfit})
          </span>
        </div>
      </div>

      {/* Interactive Practice Simulation Feedback */}
      {simState === 'settled' ? (
        <div className="bg-[#181C25] text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs leading-relaxed">
            {simWon ? (
              <>
                <span className="font-semibold text-[#34D399]">Practice prediction right:</span>{' '}
                Virtual balance gained <span className="font-mono tabular-nums">+${potentialProfit}</span>.
              </>
            ) : (
              <>
                <span className="font-semibold text-[#FCA5A5]">Market moved the other way:</span>{' '}
                Loss stopped cleanly at your <span className="font-mono tabular-nums">${stake}.00</span> stake cap.
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/85 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenFullDemo(selectedMarketId)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Full Demo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={simState === 'running'}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-[#181C25] bg-white hover:bg-[#F3F4F6] border border-[#181C25]/15 rounded-xl transition-colors duration-150 cursor-pointer disabled:opacity-60"
        >
          <Play className="w-4 h-4 text-[#FF444F]" />
          <span>
            {simState === 'running'
              ? 'Checking simulated price movement...'
              : 'Simulate This Practice Trade'}
          </span>
        </button>
      )}
    </div>
  );
}
