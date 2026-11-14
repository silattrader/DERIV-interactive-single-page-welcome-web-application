export interface PillarItem {
  id: string;
  number: string;
  title: string;
  instrumentLabel: string;
  summary: string;
  everydayAnalogy: string;
  exampleStake: string;
  exampleOutcome: string;
}

export type MarketId = 'gold' | 'btc' | 'tech100' | 'eurusd' | 'volatility75';

export interface PersonaItem {
  id: 'beginner' | 'mobile' | 'analyst';
  tabLabel: string;
  headline: string;
  painPoint: string;
  recommendedSetup: string;
  starterAsset: string;
  firstStep: string;
  demoMarketId: MarketId;
  imageSrc: string;
  imageAlt: string;
}

export interface MarketOption {
  id: MarketId;
  name: string;
  shortLabel: string;
  basePrice: number;
  decimals: number;
  availability: string;
  payoutMultiplier: number;
  description: string;
}

export interface WatchlistInstrument {
  symbol: string;
  label: string;
  roleNote: string;
  demoMarketId: MarketId;
}

export interface AssetClassItem {
  id: string;
  shortCategory: string;
  name: string;
  examples: string;
  hours: string;
  plainDescription: string;
  bestFor: 'long-term' | 'short-term' | 'both';
  bestForLabel: string;
  demoMarketId: MarketId;
  colorHex: string;
  watchlistInstruments: WatchlistInstrument[];
}

export const MARKET_OPTIONS: MarketOption[] = [
  {
    id: 'gold',
    name: 'Gold (XAU/USD)',
    shortLabel: 'Gold',
    basePrice: 2684.4,
    decimals: 2,
    availability: 'Global commodity market',
    payoutMultiplier: 1.85,
    description: 'Predict gold price moves without buying physical bullion.',
  },
  {
    id: 'btc',
    name: 'Bitcoin (BTC/USD)',
    shortLabel: 'Crypto',
    basePrice: 89420.0,
    decimals: 2,
    availability: 'Open 24/7 digital asset market',
    payoutMultiplier: 1.86,
    description: 'Trade cryptocurrency price moves without setting up a wallet.',
  },
  {
    id: 'tech100',
    name: 'US Tech 100 Index',
    shortLabel: 'Stocks',
    basePrice: 20845.2,
    decimals: 2,
    availability: 'Major global equity market',
    payoutMultiplier: 1.84,
    description: 'Follow 100 leading technology companies in a single index.',
  },
  {
    id: 'eurusd',
    name: 'EUR / USD',
    shortLabel: 'EUR/USD',
    basePrice: 1.0842,
    decimals: 4,
    availability: 'Major global currency pair',
    payoutMultiplier: 1.88,
    description: 'Track everyday shifts between the Euro and US Dollar.',
  },
  {
    id: 'volatility75',
    name: 'Volatility 75 Index',
    shortLabel: '24/7 Index',
    basePrice: 412890.5,
    decimals: 2,
    availability: 'Open 24/7 including weekends',
    payoutMultiplier: 1.92,
    description: 'Simulated market with steady, transparent price movement anytime.',
  },
];

export const ASSET_CLASSES: AssetClassItem[] = [
  {
    id: 'forex',
    shortCategory: 'Forex',
    name: 'Forex (Major Currencies)',
    examples: 'EUR/USD · GBP/USD · USD/JPY',
    hours: '24h/5d market',
    plainDescription:
      'Trade everyday exchange rate shifts between major world currencies driven by interest rates and economic news.',
    bestFor: 'short-term',
    bestForLabel: 'Short-term & intraday trading',
    demoMarketId: 'eurusd',
    colorHex: '#181C25',
    watchlistInstruments: [
      {
        symbol: 'EUR/USD',
        label: 'Euro / US Dollar',
        roleNote: 'Tightest spreads & steady news reactions',
        demoMarketId: 'eurusd',
      },
      {
        symbol: 'GBP/USD',
        label: 'British Pound / US Dollar',
        roleNote: 'Higher daily range for active swings',
        demoMarketId: 'eurusd',
      },
    ],
  },
  {
    id: 'crypto',
    shortCategory: 'Crypto',
    name: 'Cryptocurrencies',
    examples: 'Bitcoin (BTC) · Ethereum (ETH) · Solana',
    hours: 'Open 24/7',
    plainDescription:
      'Capture upward or downward moves across major digital coins with zero wallet keys or blockchain gas fees to manage.',
    bestFor: 'both',
    bestForLabel: 'Multi-week holds & rapid moves',
    demoMarketId: 'btc',
    colorHex: '#FF444F',
    watchlistInstruments: [
      {
        symbol: 'BTC/USD',
        label: 'Bitcoin',
        roleNote: '24/7 flagship crypto benchmark',
        demoMarketId: 'btc',
      },
      {
        symbol: 'ETH/USD',
        label: 'Ethereum',
        roleNote: 'Smart-contract market momentum',
        demoMarketId: 'btc',
      },
    ],
  },
  {
    id: 'derived-indices',
    shortCategory: 'Synthetic Indices',
    name: '24/7 Synthetic Indices',
    examples: 'Volatility 75 · Crash/Boom · Step Index',
    hours: 'Open 24/7 including weekends',
    plainDescription:
      'Simulated markets with consistent, transparent volatility levels built so you can practice or trade anytime.',
    bestFor: 'short-term',
    bestForLabel: 'Short-term practice & 24/7 sessions',
    demoMarketId: 'volatility75',
    colorHex: '#0D9488',
    watchlistInstruments: [
      {
        symbol: 'Volatility 75',
        label: 'Volatility 75 Index',
        roleNote: 'Steady 24/7 simulated volatility',
        demoMarketId: 'volatility75',
      },
      {
        symbol: 'Step Index',
        label: 'Step Index',
        roleNote: 'Fixed-increment moves for beginners',
        demoMarketId: 'volatility75',
      },
    ],
  },
  {
    id: 'stocks-indices',
    shortCategory: 'Stocks',
    name: 'Global Stocks & Indices',
    examples: 'US Tech 100 · S&P 500 · Apple · Nvidia',
    hours: 'Global exchange hours',
    plainDescription:
      'Gain exposure to leading companies or entire stock market baskets over weeks and months without buying full-priced shares.',
    bestFor: 'long-term',
    bestForLabel: 'Long-term position building',
    demoMarketId: 'tech100',
    colorHex: '#475569',
    watchlistInstruments: [
      {
        symbol: 'US Tech 100',
        label: 'Nasdaq-100 Basket',
        roleNote: 'Diversified 100-company tech exposure',
        demoMarketId: 'tech100',
      },
      {
        symbol: 'AAPL / NVDA',
        label: 'Leading US Equities',
        roleNote: 'Follow quarterly earnings & growth trends',
        demoMarketId: 'tech100',
      },
    ],
  },
  {
    id: 'gold-commodities',
    shortCategory: 'Gold',
    name: 'Gold & Precious Metals',
    examples: 'Gold (XAU/USD) · Silver · Platinum',
    hours: '23h/5d global market',
    plainDescription:
      'Classic commodity trading—track gold and metal prices as inflation hedges or short-term swings without storing physical bars.',
    bestFor: 'both',
    bestForLabel: 'Long-term trends & short-term swings',
    demoMarketId: 'gold',
    colorHex: '#D97706',
    watchlistInstruments: [
      {
        symbol: 'XAU/USD',
        label: 'Gold Spot',
        roleNote: 'Classic safe-haven macro hedge',
        demoMarketId: 'gold',
      },
    ],
  },
  {
    id: 'energy-commodities',
    shortCategory: 'Energy',
    name: 'Energy & Raw Materials',
    examples: 'Crude Oil (WTI) · Brent · Natural Gas',
    hours: '23h/5d market',
    plainDescription:
      'Follow real-world global supply, seasonal demand, and energy price cycles from one account.',
    bestFor: 'long-term',
    bestForLabel: 'Macro & multi-week trends',
    demoMarketId: 'gold',
    colorHex: '#64748B',
    watchlistInstruments: [
      {
        symbol: 'US Oil (WTI)',
        label: 'Crude Oil Benchmark',
        roleNote: 'Supply-demand cycle exposure',
        demoMarketId: 'gold',
      },
    ],
  },
];

export const PILLARS: PillarItem[] = [
  {
    id: 'no-ownership',
    number: '01',
    title: 'Trade Without Owning the Asset',
    instrumentLabel: 'CFDs & Multipliers',
    summary:
      'Profit from rising or falling prices in Gold, Forex, Tech Stocks, and Crypto without needing thousands of dollars to buy full shares or physical bars.',
    everydayAnalogy:
      'Think of it like predicting tomorrow’s weather rather than buying a weather station. You trade the price direction—up or down—starting with small amounts.',
    exampleStake: '$20 stake on Gold price direction',
    exampleOutcome: 'No $2,600+ needed to own a full ounce of gold.',
  },
  {
    id: 'capped-risk',
    number: '02',
    title: 'Know Your Maximum Risk Upfront',
    instrumentLabel: 'Options & Multipliers',
    summary:
      'Unlike traditional leveraged trading where losses can snowball, Deriv lets you cap your maximum loss to the exact stake you choose before entering a trade.',
    everydayAnalogy:
      'Before you confirm any trade, you see the exact worst-case dollar amount on screen. Even if the market jumps sharply, you never owe more than your stake.',
    exampleStake: '$25 stake selected with built-in cap',
    exampleOutcome: 'Worst-case loss stays fixed at $25—never a surprise bill.',
  },
  {
    id: 'always-open',
    number: '03',
    title: '24/7 Markets That Never Sleep',
    instrumentLabel: 'Derived Indices',
    summary:
      'Practice or trade anytime—even on weekends—on exclusive simulated markets with steady, transparent volatility levels.',
    everydayAnalogy:
      'Standard stock and currency exchanges close on Friday night. Derived Indices stay open every hour of the year so you can practice on your schedule.',
    exampleStake: 'Saturday morning $10 practice trade',
    exampleOutcome: 'Consistent simulated speed with no weekend waiting.',
  },
];

export const PERSONAS: PersonaItem[] = [
  {
    id: 'beginner',
    tabLabel: "I'm Brand New to Trading",
    headline: 'Start safely with zero financial jargon and zero real-money pressure.',
    painPoint: 'Afraid of losing money or getting lost in complex charts.',
    recommendedSetup: 'Deriv Trader (clean, visual interface) + $10,000 Free Demo Account',
    starterAsset: 'Volatility 75 Index (24/7 practice market)',
    firstStep: 'Make 3 practice predictions on Synthetic Indices with zero real money.',
    demoMarketId: 'volatility75',
    imageSrc: '/src/assets/images/persona_beginner_desk_1794634649067.jpg',
    imageAlt: 'New trader reviewing clean markets calmly on a laptop at a sunlit wooden desk',
  },
  {
    id: 'mobile',
    tabLabel: 'I Want to Trade On-the-Go',
    headline: 'Check prices, cap your risk, and manage trades in seconds from your phone.',
    painPoint: 'Busy schedule; wants quick market access from a phone.',
    recommendedSetup: 'Deriv GO (mobile-first app) with instant notifications and built-in take-profit/stop-loss controls',
    starterAsset: 'Gold (XAU/USD) and EUR/USD',
    firstStep: 'Explore bite-sized trades on Gold and EUR/USD.',
    demoMarketId: 'gold',
    imageSrc: '/src/assets/images/persona_mobile_onthego_1794634649812.jpg',
    imageAlt: 'Professional checking mobile trading controls in a bright glass atrium',
  },
  {
    id: 'analyst',
    tabLabel: "I'm an Experienced Chart Analyst",
    headline: 'Full technical indicators, tighter execution, and no-code automation.',
    painPoint: 'Needs pro indicators, automation, or copy trading.',
    recommendedSetup: 'Deriv MT5 / Deriv cTrader / TradingView with zero-commission CFDs and automated Deriv Bot',
    starterAsset: 'Major Forex pairs, Global Indices & Multipliers',
    firstStep: 'Connect to MT5 or test a no-code automated strategy.',
    demoMarketId: 'eurusd',
    imageSrc: '/src/assets/images/persona_analyst_studio_1794634650451.jpg',
    imageAlt: 'Experienced market analyst reviewing clean candlestick charts in a quiet studio',
  },
];

export const STARTER_QUESTIONS = [
  'I have $50 and zero experience—how does this work?',
  'What is driving Gold and Bitcoin prices right now?',
  'What is the difference between CFDs and Multipliers?',
  'Can I lose more money than I deposit?',
];

export const ONBOARDING_STEPS = [
  {
    step: '01',
    title: 'Open a free account in 60 seconds',
    detail: 'Sign up with your email or Google account—no credit card or deposit required.',
  },
  {
    step: '02',
    title: 'Practice with $10,000 virtual funds',
    detail: 'Test predictions on gold, currencies, or 24/7 markets with zero real-money risk.',
  },
  {
    step: '03',
    title: 'Switch to real from $5 when confident',
    detail: 'Move to a live account starting from $5 only when you understand how every trade behaves.',
  },
];
