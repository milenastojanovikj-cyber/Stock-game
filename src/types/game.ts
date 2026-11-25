export type StockSymbol =
  | 'SIF'
  | 'GGE'
  | 'TEC'
  | 'GRN'
  | 'BND'
  | 'SEM'
  | 'BIO'
  | 'ROB'
  | 'FIN'
  | 'REIT';

export interface StockDefinition {
  symbol: StockSymbol;
  name: string;
  riskLabel: string;
  initialPrice: number;
  drift: number;
  volatility: number;
}

export interface StockMarketItem extends StockDefinition {
  price: number;
  previousPrice: number;
  history: number[];
}

export type LogSeverity = 'positive' | 'negative' | 'warning' | 'neutral';

export interface LogEntry {
  id: string;
  month: number;
  title: string;
  detail: string;
  severity: LogSeverity;
}

export interface GoalsCompleted {
  emergency: boolean;
  debt: boolean;
  invest: boolean;
  win: boolean;
}

export interface GameState {
  month: number;
  cash: number;
  emergency: number;
  debt: number;
  jobLevel: number;
  skills: number;
  experience: number;
  raiseBonus: number;
  raisesAtCurrentJob: number;
  holdings: Record<StockSymbol, number>;
  stocks: StockMarketItem[];
  goals: GoalsCompleted;
  over: boolean;
  wonAcknowledged: boolean;
  peakNetWorth: number;
  history: LogEntry[];
}

export type SpendChoiceType = 'impulse' | 'loan' | 'luxury' | 'healthy';

export type MiniGameId = 'reflex' | 'cashier' | 'timing' | 'audit' | 'rebalance';

export type MobileTab = 'play' | 'games' | 'market' | 'plan' | 'goals';

export interface MonthlyPlan {
  save: number;
  pay: number;
  invest: number;
}
