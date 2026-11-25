import { GameState, StockDefinition, StockMarketItem, StockSymbol } from '../types/game';

export const ESSENTIAL_BILLS = 1500;
export const COURSE_COST = 300;
export const RAISE_AMOUNT = 150;
export const MAX_RAISES_PER_JOB = 2;

export const JOB_LEVELS = [
  { title: 'Part-time', income: 2200 },
  { title: 'Full-time', income: 2800 },
  { title: 'Skilled role', income: 3600 },
  { title: 'Advanced career', income: 4600 },
] as const;

export const STOCK_DEFINITIONS: StockDefinition[] = [
  { symbol: 'SIF', name: 'Steady Index Fund', riskLabel: 'Low risk', initialPrice: 100, drift: 0.007, volatility: 0.015 },
  { symbol: 'GGE', name: 'Global Growth ETF', riskLabel: 'Moderate risk', initialPrice: 55, drift: 0.011, volatility: 0.035 },
  { symbol: 'TEC', name: 'Tech Innovators', riskLabel: 'High growth', initialPrice: 80, drift: 0.015, volatility: 0.055 },
  { symbol: 'SEM', name: 'Semiconductor Leaders', riskLabel: 'High growth', initialPrice: 145, drift: 0.019, volatility: 0.068 },
  { symbol: 'ROB', name: 'Robotics & Automation', riskLabel: 'High growth', initialPrice: 115, drift: 0.018, volatility: 0.062 },
  { symbol: 'FIN', name: 'FinTech Platforms', riskLabel: 'Growth', initialPrice: 68, drift: 0.015, volatility: 0.052 },
  { symbol: 'BIO', name: 'Biotech Breakthroughs', riskLabel: 'Aggressive', initialPrice: 42, drift: 0.017, volatility: 0.088 },
  { symbol: 'GRN', name: 'Green Energy Co.', riskLabel: 'High volatility', initialPrice: 30, drift: 0.011, volatility: 0.072 },
  { symbol: 'REIT', name: 'Real Estate Trust', riskLabel: 'Steady income', initialPrice: 75, drift: 0.010, volatility: 0.025 },
  { symbol: 'BND', name: 'Bond Fund', riskLabel: 'Stable income', initialPrice: 50, drift: 0.004, volatility: 0.006 },
];

export const DIVERSIFIED_ALLOCATION: Array<[StockSymbol, number]> = [
  ['SIF', 0.35],
  ['GGE', 0.20],
  ['SEM', 0.15],
  ['TEC', 0.10],
  ['REIT', 0.10],
  ['BND', 0.10],
];

export const SPENDING_CHOICES = [
  {
    id: 'healthy' as const,
    title: 'Healthy choice',
    costLabel: '-$250 cash',
    description: 'Groceries, exercise, or personal learning that supports long-term resilience.',
    tone: 'positive' as const,
  },
  {
    id: 'impulse' as const,
    title: 'Impulse shopping spree',
    costLabel: '-$600 cash',
    description: 'Temporary excitement with no lasting financial security.',
    tone: 'negative' as const,
  },
  {
    id: 'luxury' as const,
    title: 'Luxury upgrade',
    costLabel: '-$900 cash',
    description: 'Major lifestyle splurge — make sure essentials and savings come first.',
    tone: 'warning' as const,
  },
  {
    id: 'loan' as const,
    title: 'Payday loan',
    costLabel: '+$800 cash · +$1,600 debt',
    description: 'Immediate cash relief today at double the debt burden later.',
    tone: 'negative' as const,
  },
];

export const MINI_GAMES = [
  {
    id: 'reflex' as const,
    title: 'Deal Hunter',
    entryCost: 100,
    subtitle: '12s reflex grid: tap profit deals, dodge hidden fees',
    rewardHint: 'Win up to +$200',
  },
  {
    id: 'cashier' as const,
    title: 'Exact Change Sprint',
    entryCost: 150,
    subtitle: 'Solve 3 register math problems before time runs out',
    rewardHint: 'Win up to +$150',
  },
  {
    id: 'timing' as const,
    title: 'Precision Budget Lock',
    entryCost: 120,
    subtitle: 'Stop the sweeping needle inside the green savings zone',
    rewardHint: 'Win up to +$150',
  },
  {
    id: 'audit' as const,
    title: 'Invoice Audit',
    entryCost: 200,
    subtitle: 'Spot 4 math or overcharge errors in 20 seconds',
    rewardHint: 'Win up to +$300',
  },
  {
    id: 'rebalance' as const,
    title: 'Asset vs Liability Rush',
    entryCost: 250,
    subtitle: '15s rapid sort: keep wealth assets, cut money traps',
    rewardHint: 'Win up to +$400',
  },
];

export function createInitialStocks(): StockMarketItem[] {
  return STOCK_DEFINITIONS.map((def) => ({
    ...def,
    price: def.initialPrice,
    previousPrice: def.initialPrice,
    history: [def.initialPrice],
  }));
}

export function createInitialHoldings(): Record<StockSymbol, number> {
  return {
    SIF: 0,
    GGE: 0,
    TEC: 0,
    GRN: 0,
    BND: 0,
    SEM: 0,
    BIO: 0,
    ROB: 0,
    FIN: 0,
    REIT: 0,
  };
}

export function createInitialGameState(): GameState {
  const stocks = createInitialStocks();
  const holdings = createInitialHoldings();

  return {
    month: 1,
    cash: 1500,
    emergency: 0,
    debt: 5000,
    jobLevel: 0,
    skills: 0,
    experience: 0,
    raiseBonus: 0,
    raisesAtCurrentJob: 0,
    holdings,
    stocks,
    goals: {
      emergency: false,
      debt: false,
      invest: false,
      win: false,
    },
    over: false,
    wonAcknowledged: false,
    peakNetWorth: 1500 - 5000,
    history: [
      {
        id: 'init-1',
        month: 1,
        title: 'Quest started',
        detail: 'Build a $3,000 emergency fund, clear your $5,000 debt, invest steadily, and reach a 90 well-being score.',
        severity: 'neutral',
      },
    ],
  };
}

export function calculateInvestedValue(holdings: Record<StockSymbol, number>, stocks: StockMarketItem[]): number {
  return stocks.reduce((sum, stock) => sum + (holdings[stock.symbol] || 0) * stock.price, 0);
}

export function calculateMonthlyIncome(jobLevel: number, raiseBonus = 0): number {
  return (JOB_LEVELS[jobLevel]?.income ?? JOB_LEVELS[0].income) + raiseBonus;
}

export function calculateHireChance(skills: number, experience: number): number {
  const raw = 20 + skills * 30 + experience * 8;
  return Math.min(100, raw);
}

export function calculateRaiseChance(skills: number, experience: number): number {
  const raw = 25 + experience * 15 + skills * 10;
  return Math.min(95, raw);
}

export function calculateWellBeingScore(state: GameState): number {
  const invested = calculateInvestedValue(state.holdings, state.stocks);
  const emergencyPart = Math.min(1, state.emergency / 3000);
  const debtPart = state.debt === 0 ? 1 : Math.max(0, 1 - state.debt / 5000);
  const investedPart = Math.min(1, invested / 10000);
  const cashPart = Math.min(1, Math.max(0, state.cash) / 1000);
  return Math.round(100 * (0.30 * emergencyPart + 0.25 * debtPart + 0.25 * investedPart + 0.20 * cashPart));
}

export function calculateNetWorth(state: GameState): number {
  const invested = calculateInvestedValue(state.holdings, state.stocks);
  return state.cash + state.emergency + invested - state.debt;
}

export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded < 0) {
    return '-$' + Math.abs(rounded).toLocaleString('en-US');
  }
  return '$' + rounded.toLocaleString('en-US');
}
