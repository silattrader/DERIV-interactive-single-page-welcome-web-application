import { useState } from 'react';
import { ArrowRight, Bell, Bot, Compass, Play, ShieldCheck } from 'lucide-react';
import { PERSONAS, type MarketOption, type PersonaItem } from '../data/derivContent';

interface WhoIsItForSectionProps {
  onOpenDemo: (marketId: MarketOption['id']) => void;
}

const BOT_CONDITIONS = [
  { id: 'rsi', label: 'RSI Dip (< 30) on Gold', baseWinRate: 58, avgGain: 1.82 },
  { id: 'breakout', label: '15m Momentum Breakout on Crypto', baseWinRate: 54, avgGain: 1.95 },
  { id: 'step', label: 'Mean Reversion on Step Index', baseWinRate: 62, avgGain: 1.72 },
] as const;

export function WhoIsItForSection({ onOpenDemo }: WhoIsItForSectionProps) {
  const [activeId, setActiveId] = useState<PersonaItem['id']>('beginner');
  const [panelMode, setPanelMode] = useState<'overview' | 'workspace'>('overview');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Interactive workspace state per persona
  const [beginnerStopPct, setBeginnerStopPct] = useState<50 | 100>(50);
  const [mobileAlertUsd, setMobileAlertUsd] = useState<number>(15);
  const [botRuleId, setBotRuleId] = useState<(typeof BOT_CONDITIONS)[number]['id']>('rsi');
  const [botStake, setBotStake] = useState<number>(20);
  const [backtestResult, setBacktestResult] = useState<{
    wins: number;
    losses: number;
    netPnl: number;
    maxDrawdown: number;
  } | null>(null);

  const activePersona = PERSONAS.find((p) => p.id === activeId) ?? PERSONAS[0];
  const imageFailed = Boolean(failedImages[activePersona.id]);
  const activeBotRule = BOT_CONDITIONS.find((r) => r.id === botRuleId) ?? BOT_CONDITIONS[0];

  const runSimulatedBacktest = () => {
    const totalSessions = 30;
    const variance = Math.floor(Math.random() * 4) - 1;
    const wins = Math.min(24, Math.max(12, Math.round((activeBotRule.baseWinRate / 100) * totalSessions) + variance));
    const losses = totalSessions - wins;
    const grossWin = wins * botStake * (activeBotRule.avgGain - 1);
    const grossLoss = losses * botStake * 0.75; // reflects built-in stop-loss cap
    const netPnl = Number((grossWin - grossLoss).toFixed(2));
    const maxDrawdown = Number((botStake * 3.2).toFixed(2));
    setBacktestResult({ wins, losses, netPnl, maxDrawdown });
  };

  return (
    <section id="who-its-for" className="py-16 sm:py-24 bg-white border-b border-[#181C25]/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-[#FF444F] tracking-tight mb-2">
              Tailored Experience &amp; Platform Preview
            </p>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#181C25] tracking-tight text-balance">
              Who Is Deriv For?
            </h2>
          </div>

          {/* 3 Clickable Visitor Persona Tabs */}
          <div
            role="tablist"
            aria-label="Choose your trading experience level"
            className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 bg-[#FAF9F7] border border-[#181C25]/10 rounded-xl"
          >
            {PERSONAS.map((persona) => {
              const selected = persona.id === activeId;
              return (
                <button
                  key={persona.id}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveId(persona.id);
                    setBacktestResult(null);
                  }}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    selected
                      ? 'bg-[#181C25] text-white'
                      : 'text-[#181C25]/70 hover:text-[#181C25] hover:bg-white/70'
                  }`}
                >
                  {persona.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Persona Content Panel */}
        <div
          role="tabpanel"
          className="bg-[#FAF9F7] border border-[#181C25]/10 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
        >
          {/* Left: Editorial photo with Zero-Broken-Image fallback */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full bg-[#ECEAE4]">
            {!imageFailed ? (
              <img
                src={activePersona.imageSrc}
                alt={activePersona.imageAlt}
                referrerPolicy="no-referrer"
                onError={() =>
                  setFailedImages((prev) => ({
                    ...prev,
                    [activePersona.id]: true,
                  }))
                }
                className="w-full h-full object-cover aspect-[4/3] lg:aspect-auto lg:h-full"
              />
            ) : (
              <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#F3F1EC] to-[#E5E2DA]">
                <Compass className="w-10 h-10 text-[#181C25]/40 mb-3" />
                <p className="font-display font-semibold text-[#181C25]">
                  {activePersona.tabLabel}
                </p>
                <p className="text-xs text-[#181C25]/60 mt-1">{activePersona.recommendedSetup}</p>
              </div>
            )}
          </div>

          {/* Right: Overview vs Interactive Platform Preview */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-7">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-[#181C25]/55">
                  Selected profile · {activePersona.tabLabel}
                </p>

                <div className="flex items-center gap-1 p-1 bg-white border border-[#181C25]/10 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPanelMode('overview')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      panelMode === 'overview'
                        ? 'bg-[#181C25] text-white'
                        : 'text-[#181C25]/65 hover:text-[#181C25]'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelMode('workspace')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      panelMode === 'workspace'
                        ? 'bg-[#FF444F] text-white'
                        : 'text-[#181C25]/65 hover:text-[#181C25]'
                    }`}
                  >
                    Interactive Platform Preview
                  </button>
                </div>
              </div>

              {panelMode === 'overview' ? (
                <>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-[#181C25] tracking-tight text-balance">
                    {activePersona.headline}
                  </h3>

                  <dl className="divide-y divide-[#181C25]/10 border-y border-[#181C25]/10">
                    <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                      <dt className="text-xs font-medium text-[#181C25]/55">Challenge solved</dt>
                      <dd className="sm:col-span-2 text-sm text-[#181C25]">
                        {activePersona.painPoint}
                      </dd>
                    </div>
                    <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                      <dt className="text-xs font-medium text-[#181C25]/55">Recommended setup</dt>
                      <dd className="sm:col-span-2 text-sm font-semibold text-[#181C25]">
                        {activePersona.recommendedSetup}
                      </dd>
                    </div>
                    <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                      <dt className="text-xs font-medium text-[#181C25]/55">Starter market</dt>
                      <dd className="sm:col-span-2 text-sm text-[#181C25]">
                        {activePersona.starterAsset}
                      </dd>
                    </div>
                    <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                      <dt className="text-xs font-medium text-[#181C25]/55">Your first step</dt>
                      <dd className="sm:col-span-2 text-sm text-[#181C25]">
                        {activePersona.firstStep}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : activePersona.id === 'beginner' ? (
                <div className="bg-white border border-[#181C25]/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#181C25]">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                    <span>Inside Deriv Trader: Guided Risk Guard</span>
                  </div>
                  <p className="text-xs text-[#181C25]/70 leading-relaxed">
                    Every Deriv Trader ticket asks you to pick a maximum stop-loss before entering.
                    Toggle between a 50% automatic guard or full stake cap on a $20 practice trade:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBeginnerStopPct(50)}
                      className={`p-3 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                        beginnerStopPct === 50
                          ? 'bg-[#181C25] text-white border-[#181C25]'
                          : 'bg-[#FAF9F7] text-[#181C25] border-[#181C25]/12'
                      }`}
                    >
                      <p className="font-semibold">50% Early Guard</p>
                      <p className="font-mono tabular-nums opacity-75 mt-0.5">
                        Auto-exits at -$10.00 max
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBeginnerStopPct(100)}
                      className={`p-3 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                        beginnerStopPct === 100
                          ? 'bg-[#181C25] text-white border-[#181C25]'
                          : 'bg-[#FAF9F7] text-[#181C25] border-[#181C25]/12'
                      }`}
                    >
                      <p className="font-semibold">Full Stake Cap</p>
                      <p className="font-mono tabular-nums opacity-75 mt-0.5">
                        Max loss fixed at -$20.00
                      </p>
                    </button>
                  </div>
                </div>
              ) : activePersona.id === 'mobile' ? (
                <div className="bg-white border border-[#181C25]/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#181C25]">
                    <Bell className="w-4 h-4 text-[#FF444F]" />
                    <span>Inside Deriv GO: One-Thumb Alert &amp; Exit Rules</span>
                  </div>
                  <p className="text-xs text-[#181C25]/70 leading-relaxed">
                    Set instant phone price alerts on Gold or EUR/USD so you never have to stare at
                    charts during work:
                  </p>
                  <div className="flex items-center justify-between gap-4 bg-[#FAF9F7] p-3.5 rounded-lg">
                    <span className="text-xs font-medium text-[#181C25]">
                      Notify me when Gold moves by
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[10, 15, 25].map((usd) => (
                        <button
                          key={usd}
                          type="button"
                          onClick={() => setMobileAlertUsd(usd)}
                          className={`px-2.5 py-1 font-mono tabular-nums text-xs font-semibold rounded-md border cursor-pointer ${
                            mobileAlertUsd === usd
                              ? 'bg-[#181C25] text-white border-[#181C25]'
                              : 'bg-white text-[#181C25] border-[#181C25]/15'
                          }`}
                        >
                          ±${usd}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#0D9488] font-medium">
                    Alert armed: You will get a push notification if Gold crosses{' '}
                    <span className="font-mono tabular-nums">
                      ${(2684.4 + mobileAlertUsd).toFixed(2)}
                    </span>{' '}
                    or{' '}
                    <span className="font-mono tabular-nums">
                      ${(2684.4 - mobileAlertUsd).toFixed(2)}
                    </span>
                    .
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-[#181C25]/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#181C25]">
                      <Bot className="w-4 h-4 text-[#FF444F]" />
                      <span>Deriv Bot: No-Code Strategy Backtester</span>
                    </div>
                    <span className="font-mono tabular-nums text-xs text-[#181C25]/55">
                      30 simulated sessions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {BOT_CONDITIONS.map((rule) => (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => {
                          setBotRuleId(rule.id);
                          setBacktestResult(null);
                        }}
                        className={`p-2.5 text-left text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          botRuleId === rule.id
                            ? 'bg-[#181C25] text-white border-[#181C25]'
                            : 'bg-[#FAF9F7] text-[#181C25] border-[#181C25]/12'
                        }`}
                      >
                        {rule.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#181C25]/65">Stake/trade:</span>
                      {[10, 20, 50].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setBotStake(s);
                            setBacktestResult(null);
                          }}
                          className={`px-2.5 py-1 font-mono tabular-nums text-xs font-semibold rounded-md border cursor-pointer ${
                            botStake === s
                              ? 'bg-[#181C25] text-white border-[#181C25]'
                              : 'bg-[#FAF9F7] text-[#181C25] border-[#181C25]/15'
                          }`}
                        >
                          ${s}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={runSimulatedBacktest}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#181C25] hover:bg-[#2A303E] rounded-lg transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Run Backtest</span>
                    </button>
                  </div>

                  {backtestResult && (
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#181C25]/8">
                      <div>
                        <p className="text-[11px] text-[#181C25]/55">Simulated win rate</p>
                        <p className="font-mono tabular-nums text-sm font-bold text-[#181C25]">
                          {Math.round((backtestResult.wins / 30) * 100)}% ({backtestResult.wins}/30)
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#181C25]/55">Max drawdown</p>
                        <p className="font-mono tabular-nums text-sm font-bold text-[#181C25]">
                          -${backtestResult.maxDrawdown.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#181C25]/55">Net virtual result</p>
                        <p
                          className={`font-mono tabular-nums text-sm font-bold ${
                            backtestResult.netPnl >= 0 ? 'text-[#0D9488]' : 'text-[#FF444F]'
                          }`}
                        >
                          {backtestResult.netPnl >= 0
                            ? `+$${backtestResult.netPnl.toFixed(2)}`
                            : `-$${Math.abs(backtestResult.netPnl).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onOpenDemo(activePersona.demoMarketId)}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Try This Setup in Free $10,000 Demo</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <span className="text-xs text-[#181C25]/55">
                No deposit or credit card needed
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
