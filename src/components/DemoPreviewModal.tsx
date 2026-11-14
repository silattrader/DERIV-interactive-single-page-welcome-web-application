import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { MARKET_OPTIONS, type MarketId } from '../data/derivContent';

interface DemoPreviewModalProps {
  isOpen: boolean;
  initialMarketId: MarketId;
  onClose: () => void;
}

interface PracticeTrade {
  id: number;
  marketName: string;
  direction: 'up' | 'down';
  stake: number;
  pnl: number;
}

export function DemoPreviewModal({
  isOpen,
  initialMarketId,
  onClose,
}: DemoPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'account'>('sandbox');
  const [marketId, setMarketId] = useState<MarketId>(initialMarketId);
  const [stake, setStake] = useState<number>(25);
  const [virtualBalance, setVirtualBalance] = useState<number>(10000);
  const [priceHistory, setPriceHistory] = useState<number[]>([100, 100.3, 99.9, 100.6, 100.4, 101.1, 100.8]);
  const [isSettling, setIsSettling] = useState(false);
  const [tradeLog, setTradeLog] = useState<PracticeTrade[]>([]);

  // Email save form state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    setMarketId(initialMarketId);
  }, [initialMarketId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => {
      setPriceHistory((prev) => {
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.49) * 0.8;
        const next = Math.max(95, Math.min(106, Number((last + delta).toFixed(2))));
        return [...prev.slice(-11), next];
      });
    }, 1100);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const market = MARKET_OPTIONS.find((m) => m.id === marketId) ?? MARKET_OPTIONS[0];
  const minVal = Math.min(...priceHistory);
  const maxVal = Math.max(...priceHistory);
  const range = Math.max(0.5, maxVal - minVal);

  const svgPoints = priceHistory
    .map((val, idx) => {
      const x = (idx / Math.max(1, priceHistory.length - 1)) * 280 + 10;
      const y = 84 - ((val - minVal) / range) * 64;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const livePrice = (
    market.basePrice +
    (priceHistory[priceHistory.length - 1] - 100) * (market.id === 'eurusd' ? 0.0012 : 1.5)
  ).toFixed(market.decimals);

  const placePracticeTrade = (dir: 'up' | 'down') => {
    if (isSettling || virtualBalance < stake) return;
    setIsSettling(true);

    window.setTimeout(() => {
      const won = Math.random() > 0.42;
      const pnl = won ? Number((stake * (market.payoutMultiplier - 1)).toFixed(2)) : -stake;

      setVirtualBalance((prev) => Number((prev + pnl).toFixed(2)));
      setTradeLog((prev) => [
        {
          id: Date.now(),
          marketName: market.shortLabel,
          direction: dir,
          stake,
          pnl,
        },
        ...prev.slice(0, 2),
      ]);
      setIsSettling(false);
    }, 900);
  };

  const handleSaveAccount = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError(null);
    setSavedEmail(cleaned);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181C25]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-[#181C25]/12 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#181C25]/10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#181C25]/55">
              Risk-Free Virtual Environment
            </p>
            <h2 id="demo-modal-title" className="text-lg sm:text-xl font-display font-bold text-[#181C25]">
              Deriv $10,000 Practice Preview
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close demo preview"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#181C25]/70 hover:text-[#181C25] hover:bg-[#FAF9F7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="px-6 pt-4 border-b border-[#181C25]/8 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sandbox'
                ? 'border-[#FF444F] text-[#181C25]'
                : 'border-transparent text-[#181C25]/55 hover:text-[#181C25]'
            }`}
          >
            Instant Practice Sandbox
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'account'
                ? 'border-[#FF444F] text-[#181C25]'
                : 'border-transparent text-[#181C25]/55 hover:text-[#181C25]'
            }`}
          >
            Open Free Account (60 sec)
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'sandbox' ? (
            <>
              {/* Virtual Balance & Market Picker */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FAF9F7] border border-[#181C25]/8 rounded-xl p-4">
                <div>
                  <p className="text-xs text-[#181C25]/60">Virtual demo balance</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-[#181C25]">
                    ${virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-[#181C25]/10 rounded-lg">
                  {MARKET_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMarketId(m.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        m.id === marketId
                          ? 'bg-[#181C25] text-white'
                          : 'text-[#181C25]/70 hover:text-[#181C25]'
                      }`}
                    >
                      {m.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Live-Ticking Chart Preview */}
              <div className="border border-[#181C25]/10 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#181C25]">
                    {market.name} · {market.availability}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#181C25]">
                    {livePrice}
                  </span>
                </div>

                <svg viewBox="0 0 300 96" className="w-full h-24 overflow-visible" aria-hidden="true">
                  <polyline
                    fill="none"
                    stroke="#181C25"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={svgPoints}
                  />
                </svg>
              </div>

              {/* Stake Selector & Up/Down Actions */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#181C25]/70">
                    Choose practice stake (maximum possible loss)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[10, 25, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStake(val)}
                        className={`px-3 py-1.5 font-mono tabular-nums text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          stake === val
                            ? 'bg-[#181C25] text-white border-[#181C25]'
                            : 'bg-white text-[#181C25] border-[#181C25]/15 hover:border-[#181C25]/40'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSettling}
                    onClick={() => placePracticeTrade('up')}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                    <span>{isSettling ? 'Checking price...' : 'Predict Price Up'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSettling}
                    onClick={() => placePracticeTrade('down')}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowDownRight className="w-4 h-4 shrink-0" />
                    <span>{isSettling ? 'Checking price...' : 'Predict Price Down'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[#181C25]/65 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                    <span>Max loss capped at ${stake}.00 virtual stake</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('account')}
                    className="font-semibold text-[#FF444F] hover:underline cursor-pointer"
                  >
                    Save my $10,000 demo →
                  </button>
                </div>
              </div>

              {tradeLog.length > 0 && (
                <div className="pt-4 border-t border-[#181C25]/10 space-y-2">
                  <p className="text-xs font-medium text-[#181C25]/55">Recent practice trades</p>
                  {tradeLog.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs bg-[#FAF9F7] px-3.5 py-2.5 rounded-lg"
                    >
                      <span className="font-medium text-[#181C25]">
                        {item.marketName} · {item.direction === 'up' ? 'Price Up' : 'Price Down'} (${item.stake} stake)
                      </span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          item.pnl >= 0 ? 'text-[#0D9488]' : 'text-[#FF444F]'
                        }`}
                      >
                        {item.pnl >= 0 ? `+$${item.pnl.toFixed(2)}` : `-$${Math.abs(item.pnl).toFixed(2)} (Capped)`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : savedEmail ? (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="w-11 h-11 text-[#0D9488] mx-auto" />
              <h3 className="text-xl font-display font-bold text-[#181C25]">
                Your $10,000 Demo Workspace Is Ready
              </h3>
              <p className="text-sm text-[#181C25]/70 max-w-md mx-auto">
                We&apos;ve prepared a beginner-friendly practice profile for{' '}
                <strong className="text-[#181C25]">{savedEmail}</strong> starting on{' '}
                <strong className="text-[#181C25]">{market.name}</strong>. No real money or deposit
                is required.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('sandbox')}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#181C25] hover:bg-[#2A303E] rounded-xl transition-colors cursor-pointer"
              >
                Continue Practicing in Virtual Sandbox
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <h3 className="text-base font-display font-bold text-[#181C25]">
                  Keep your $10,000 practice account
                </h3>
                <p className="text-sm text-[#181C25]/70 mt-1">
                  Enter your email to save your virtual balance and starter market ({market.name}).
                  You can practice for free as long as you want.
                </p>
              </div>

              <div>
                <label htmlFor="demo-email-input" className="block text-xs font-medium text-[#181C25]/70 mb-1.5">
                  Email address
                </label>
                <input
                  id="demo-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm text-[#181C25] border border-[#181C25]/20 rounded-xl focus:outline-none focus:border-[#181C25]"
                />
                {emailError && (
                  <p role="alert" className="mt-1.5 text-xs text-[#DC2626]">
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-5 py-3.5 text-sm font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] rounded-xl transition-colors cursor-pointer"
              >
                Create Free $10,000 Demo Account
              </button>

              <p className="text-xs text-[#181C25]/55 text-center">
                No credit card required · Switch to a real account from $5 only when you feel ready
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
