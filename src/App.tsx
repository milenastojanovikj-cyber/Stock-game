import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CalendarCheck,
  Gamepad2,
  HelpCircle,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Target,
  TrendingUp,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { EarnAndSpendPanel, SkillMiniGamesCard } from './components/EarnAndSpendPanel';
import { GameOverModal, RulesModal, VictoryModal } from './components/GameModals';
import { EventLogCard, GoalsAndLogPanel, GoalsCard } from './components/GoalsAndLogPanel';
import { MiniGameModal } from './components/MiniGameModal';
import { MonthlyPlanPanel } from './components/MonthlyPlanPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { StockMarketPanel } from './components/StockMarketPanel';
import { VitalsHeaderStrip } from './components/VitalsHeaderStrip';
import {
  COURSE_COST,
  DIVERSIFIED_ALLOCATION,
  ESSENTIAL_BILLS,
  JOB_LEVELS,
  MAX_RAISES_PER_JOB,
  RAISE_AMOUNT,
  calculateHireChance,
  calculateInvestedValue,
  calculateMonthlyIncome,
  calculateNetWorth,
  calculateRaiseChance,
  calculateWellBeingScore,
  createInitialGameState,
  createInitialHoldings,
  createInitialStocks,
  formatMoney,
} from './data/gameConfig';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  GameState,
  LogEntry,
  LogSeverity,
  MiniGameId,
  MobileTab,
  MonthlyPlan,
  SpendChoiceType,
  StockSymbol,
} from './types/game';
import { soundEngine } from './utils/sound';

const STORAGE_KEY = 'moneyquest_android_save_v2';
const WORK_SHIFT_COOLDOWN_SECONDS = 20;
const CAREER_ACTION_COOLDOWN_SECONDS = 15;

const DEFAULT_PLAN: MonthlyPlan = {
  save: 200,
  pay: 250,
  invest: 150,
};

function getMonthDuration(speed: 1 | 2): number {
  return speed === 2 ? 8 : 15;
}

function loadSavedState(): { game: GameState; plan: MonthlyPlan } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { game: createInitialGameState(), plan: DEFAULT_PLAN };
    const parsed = JSON.parse(raw) as { game?: GameState; plan?: MonthlyPlan };
    if (!parsed.game || typeof parsed.game.month !== 'number' || !Array.isArray(parsed.game.stocks)) {
      return { game: createInitialGameState(), plan: DEFAULT_PLAN };
    }
    const defaultStocks = createInitialStocks();
    const existingBySymbol = new Map(parsed.game.stocks.map((s) => [s.symbol, s]));
    const mergedStocks = defaultStocks.map((def) => existingBySymbol.get(def.symbol) ?? def);
    const mergedHoldings = {
      ...createInitialHoldings(),
      ...(parsed.game.holdings ?? {}),
    };
    return {
      game: {
        ...parsed.game,
        experience: parsed.game.experience ?? 0,
        raiseBonus: parsed.game.raiseBonus ?? 0,
        raisesAtCurrentJob: parsed.game.raisesAtCurrentJob ?? 0,
        stocks: mergedStocks,
        holdings: mergedHoldings,
      },
      plan: parsed.plan ?? DEFAULT_PLAN,
    };
  } catch {
    return { game: createInitialGameState(), plan: DEFAULT_PLAN };
  }
}

function makeLog(month: number, title: string, detail: string, severity: LogSeverity): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    month,
    title,
    detail,
    severity,
  };
}

function applyGoalsAndBillsCheck(state: GameState): GameState {
  const next = { ...state, goals: { ...state.goals }, history: [...state.history] };
  const invested = calculateInvestedValue(next.holdings, next.stocks);
  const sc = calculateWellBeingScore(next);

  if (next.emergency >= 3000 && !next.goals.emergency) {
    next.goals.emergency = true;
    next.history.unshift(
      makeLog(next.month, 'Goal complete', 'Emergency fund reached $3,000.', 'positive')
    );
  }
  if (next.debt === 0 && !next.goals.debt) {
    next.goals.debt = true;
    next.history.unshift(
      makeLog(next.month, 'Goal complete', 'You are completely debt-free!', 'positive')
    );
  }
  if (invested >= 10000 && !next.goals.invest) {
    next.goals.invest = true;
    next.history.unshift(
      makeLog(next.month, 'Goal complete', 'Investment portfolio reached $10,000.', 'positive')
    );
  }
  if (sc >= 90 && !next.goals.win) {
    next.goals.win = true;
    next.history.unshift(
      makeLog(next.month, 'You win MoneyQuest!', 'Well-being score hit 90+. Strong financial foundation achieved.', 'positive')
    );
    soundEngine.playVictory();
  }

  const netWorth = calculateNetWorth(next);
  if (netWorth > next.peakNetWorth) {
    next.peakNetWorth = netWorth;
  }

  if (next.cash < 0 || (next.cash === 0 && next.emergency === 0 && next.debt > 0)) {
    next.over = true;
    next.history.unshift(
      makeLog(next.month, 'Game Over', 'No cash left and essential obligations could not be covered.', 'negative')
    );
    soundEngine.playGameOver();
  }

  if (next.history.length > 75) {
    next.history = next.history.slice(0, 75);
  }
  return next;
}

export default function App() {
  const initial = loadSavedState();
  const [game, setGame] = useState<GameState>(initial.game);
  const [plan, setPlan] = useState<MonthlyPlan>(initial.plan);
  const [activeTab, setActiveTab] = useState<MobileTab>('play');
  const [muted, setMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [secondsLeft, setSecondsLeft] = useState<number>(getMonthDuration(1));
  const [shiftCooldown, setShiftCooldown] = useState<number>(0);
  const [hireCooldown, setHireCooldown] = useState<number>(0);
  const [raiseCooldown, setRaiseCooldown] = useState<number>(0);
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGameId | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const { isInstalled } = usePWAInstall();

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be blocked inside embedded preview iframes
    }
  };

  const planRef = useRef<MonthlyPlan>(plan);
  planRef.current = plan;

  const monthDuration = getMonthDuration(speed);
  const victoryOpen = game.goals.win && !game.wonAcknowledged && !game.over;
  const effectivePaused = userPaused || showRules || game.over || victoryOpen || activeMiniGame !== null;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ game, plan }));
    } catch {
      // Ignore storage quota errors
    }
  }, [game, plan]);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const handleSpeedChange = (nextSpeed: 1 | 2) => {
    setSpeed(nextSpeed);
    const nextMax = getMonthDuration(nextSpeed);
    setSecondsLeft((prev) => Math.min(prev, nextMax));
  };

  const restartGame = () => {
    setGame(createInitialGameState());
    setPlan(DEFAULT_PLAN);
    setActiveTab('play');
    setUserPaused(false);
    setSecondsLeft(getMonthDuration(speed));
    setShiftCooldown(0);
    setHireCooldown(0);
    setRaiseCooldown(0);
    soundEngine.playMonthAdvance();
  };

  const prependLog = (state: GameState, title: string, detail: string, severity: LogSeverity): GameState => {
    const updatedHistory = [makeLog(state.month, title, detail, severity), ...state.history].slice(0, 75);
    return { ...state, history: updatedHistory };
  };

  const processAutomaticMonthTick = useCallback(() => {
    soundEngine.playMonthAdvance();

    setGame((prev) => {
      if (prev.over) return prev;

      const currentPlan = planRef.current;
      const monthlyIncome = calculateMonthlyIncome(prev.jobLevel, prev.raiseBonus);
      const available = prev.cash + monthlyIncome - ESSENTIAL_BILLS;
      const budget = Math.max(0, available);

      let save = Math.max(0, currentPlan.save);
      let pay = Math.max(0, Math.min(prev.debt, currentPlan.pay));
      let invest = Math.max(0, currentPlan.invest);
      let wasScaled = false;

      const desiredTotal = save + pay + invest;
      if (desiredTotal > budget) {
        wasScaled = true;
        if (budget === 0) {
          save = 0;
          pay = 0;
          invest = 0;
        } else {
          const ratio = budget / desiredTotal;
          save = Math.floor(save * ratio);
          pay = Math.floor(pay * ratio);
          invest = Math.max(0, Math.floor(budget - save - pay));
        }
      }

      let next: GameState = {
        ...prev,
        holdings: { ...prev.holdings },
        history: [...prev.history],
      };

      const prevInvested = calculateInvestedValue(next.holdings, next.stocks);

      next.cash = next.cash + monthlyIncome - ESSENTIAL_BILLS - save - pay - invest;
      next.emergency += save;
      next.debt = Math.max(0, next.debt - pay);

      if (wasScaled) {
        next.history.unshift(
          makeLog(
            next.month,
            'Auto-plan adjusted',
            `Scaled monthly allocations to ${formatMoney(save + pay + invest)} to fit available cash.`,
            'warning'
          )
        );
      }

      if (save > 0) {
        next.history.unshift(
          makeLog(next.month, 'Emergency savings', `Auto-saved ${formatMoney(save)} into your emergency fund.`, 'positive')
        );
      }
      if (pay > 0) {
        next.history.unshift(
          makeLog(next.month, 'Debt payment', `Auto-paid ${formatMoney(pay)} toward debt. Remaining: ${formatMoney(next.debt)}.`, 'positive')
        );
      }
      if (invest > 0) {
        DIVERSIFIED_ALLOCATION.forEach(([sym, pct]) => {
          const stock = next.stocks.find((s) => s.symbol === sym);
          if (stock && stock.price > 0) {
            next.holdings[sym] += (invest * pct) / stock.price;
          }
        });
        next.history.unshift(
          makeLog(next.month, 'Diversified investment', `Auto-invested ${formatMoney(invest)} across your diversified fund mix.`, 'neutral')
        );
      }

      const investedBeforeMarketMove = calculateInvestedValue(next.holdings, next.stocks);
      next.stocks = next.stocks.map((stock) => {
        const change = stock.drift + (Math.random() * 2 - 1) * stock.volatility;
        const newPrice = Math.max(1, stock.price * (1 + change));
        const nextHistory = [...stock.history, newPrice].slice(-12);
        return {
          ...stock,
          previousPrice: stock.price,
          price: newPrice,
          history: nextHistory,
        };
      });

      const investedAfterMarketMove = calculateInvestedValue(next.holdings, next.stocks);
      const marketDelta = investedAfterMarketMove - investedBeforeMarketMove;
      if (Math.abs(marketDelta) >= 1 && prevInvested + invest > 0) {
        next.history.unshift(
          makeLog(
            next.month,
            'Market update',
            `Portfolio value shifted by ${marketDelta >= 0 ? '+' : ''}${formatMoney(marketDelta)} this month.`,
            marketDelta >= 0 ? 'positive' : 'negative'
          )
        );
      }

      const roll = Math.random();
      if (roll < 0.14) {
        const cost = 250 + Math.floor(Math.random() * 600);
        if (next.emergency >= cost) {
          next.emergency -= cost;
          next.history.unshift(
            makeLog(
              next.month,
              'Unexpected expense covered',
              `${formatMoney(cost)} surprise bill absorbed by your emergency fund.`,
              'warning'
            )
          );
        } else if (next.cash >= cost) {
          next.cash -= cost;
          next.history.unshift(
            makeLog(
              next.month,
              'Unexpected expense',
              `${formatMoney(cost)} surprise bill paid from cash.`,
              'warning'
            )
          );
        } else {
          next.cash = -1;
          next.history.unshift(
            makeLog(
              next.month,
              'Uncovered emergency',
              `A ${formatMoney(cost)} emergency hit when neither cash nor emergency savings could cover it.`,
              'negative'
            )
          );
        }
      } else if (roll < 0.22) {
        const bonus = 100 + Math.floor(Math.random() * 400);
        next.cash += bonus;
        next.history.unshift(
          makeLog(next.month, 'Bonus or refund', `Received an unexpected ${formatMoney(bonus)} windfall.`, 'positive')
        );
      }

      next.month += 1;
      return applyGoalsAndBillsCheck(next);
    });
  }, []);

  useEffect(() => {
    if (effectivePaused) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          processAutomaticMonthTick();
          return getMonthDuration(speed);
        }
        return prev - 1;
      });
      setShiftCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setHireCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setRaiseCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [effectivePaused, speed, processAutomaticMonthTick]);

  const handleWorkShift = () => {
    if (game.over || shiftCooldown > 0) return;
    const earned = 80 + game.jobLevel * 40;
    setShiftCooldown(WORK_SHIFT_COOLDOWN_SECONDS);
    soundEngine.playCoin();
    setGame((prev) => {
      const updated = prependLog(
        {
          ...prev,
          cash: prev.cash + earned,
          experience: prev.experience + 1,
        },
        'Work shift complete',
        `Earned ${formatMoney(earned)} and +1 work experience.`,
        'positive'
      );
      return applyGoalsAndBillsCheck(updated);
    });
  };

  const handleTakeCourse = () => {
    if (game.over) return;
    if (game.cash < COURSE_COST) {
      soundEngine.playAlert();
      setGame((prev) =>
        prependLog(
          prev,
          'Not enough cash',
          `Skills course costs ${formatMoney(COURSE_COST)}, and you currently have ${formatMoney(prev.cash)}.`,
          'negative'
        )
      );
      return;
    }

    soundEngine.playBuy();
    setGame((prev) => {
      const nextSkills = prev.skills + 1;
      const updated = prependLog(
        {
          ...prev,
          cash: prev.cash - COURSE_COST,
          skills: nextSkills,
        },
        'Skills course completed',
        `Completed course #${nextSkills}. Your hire and raise interview odds increased!`,
        'positive'
      );
      return applyGoalsAndBillsCheck(updated);
    });
  };

  const handleApplyForHire = () => {
    if (game.over || hireCooldown > 0 || game.jobLevel >= JOB_LEVELS.length - 1) return;
    const chance = calculateHireChance(game.skills, game.experience);
    const hired = Math.random() * 100 < chance;

    if (hired) {
      soundEngine.playUpgrade();
      setGame((prev) => {
        if (prev.jobLevel >= JOB_LEVELS.length - 1) return prev;
        const nextJobLevel = prev.jobLevel + 1;
        const nextJob = JOB_LEVELS[nextJobLevel];
        const totalMonthly = calculateMonthlyIncome(nextJobLevel, prev.raiseBonus);
        const updated = prependLog(
          {
            ...prev,
            jobLevel: nextJobLevel,
            skills: 0,
            experience: 0,
            raisesAtCurrentJob: 0,
          },
          `Hired: ${nextJob.title}!`,
          `New monthly income is ${formatMoney(totalMonthly)}/mo (raises preserved).`,
          'positive'
        );
        return applyGoalsAndBillsCheck(updated);
      });
    } else {
      soundEngine.playAlert();
      setHireCooldown(CAREER_ACTION_COOLDOWN_SECONDS);
      setGame((prev) =>
        prependLog(
          prev,
          'Job application declined',
          `Interview chance was ${chance}%. Complete more shifts or a skills course, then try again in ${CAREER_ACTION_COOLDOWN_SECONDS}s.`,
          'warning'
        )
      );
    }
  };

  const handleAskForRaise = () => {
    if (game.over || raiseCooldown > 0 || game.raisesAtCurrentJob >= MAX_RAISES_PER_JOB) return;
    const chance = calculateRaiseChance(game.skills, game.experience);
    const approved = Math.random() * 100 < chance;

    if (approved) {
      soundEngine.playUpgrade();
      setGame((prev) => {
        if (prev.raisesAtCurrentJob >= MAX_RAISES_PER_JOB) return prev;
        const nextRaiseBonus = prev.raiseBonus + RAISE_AMOUNT;
        const totalMonthly = calculateMonthlyIncome(prev.jobLevel, nextRaiseBonus);
        const updated = prependLog(
          {
            ...prev,
            raiseBonus: nextRaiseBonus,
            raisesAtCurrentJob: prev.raisesAtCurrentJob + 1,
            experience: Math.max(0, prev.experience - 2),
          },
          'Raise approved!',
          `Salary increased by +${formatMoney(RAISE_AMOUNT)}/mo. New monthly income: ${formatMoney(totalMonthly)}/mo.`,
          'positive'
        );
        return applyGoalsAndBillsCheck(updated);
      });
    } else {
      soundEngine.playAlert();
      setRaiseCooldown(CAREER_ACTION_COOLDOWN_SECONDS);
      setGame((prev) =>
        prependLog(
          prev,
          'Raise request declined',
          `Approval odds were ${chance}%. Work more shifts or take a course, then ask again in ${CAREER_ACTION_COOLDOWN_SECONDS}s.`,
          'warning'
        )
      );
    }
  };

  const handleMiniGameComplete = (netDelta: number, title: string, detail: string) => {
    setGame((prev) => {
      const severity: LogSeverity = netDelta > 0 ? 'positive' : netDelta < 0 ? 'negative' : 'neutral';
      const updated = prependLog(
        {
          ...prev,
          cash: prev.cash + netDelta,
        },
        title,
        detail,
        severity
      );
      return applyGoalsAndBillsCheck(updated);
    });
  };

  const handleSpendChoice = (choice: SpendChoiceType) => {
    if (game.over) return;

    setGame((prev) => {
      let next = { ...prev };

      if (choice === 'impulse') {
        if (next.cash < 600) {
          soundEngine.playAlert();
          return prependLog(
            next,
            'Not enough cash',
            `Impulse shopping costs $600, but you only have ${formatMoney(next.cash)}.`,
            'negative'
          );
        }
        soundEngine.playAlert();
        next.cash -= 600;
        next = prependLog(
          next,
          'Impulse shopping',
          'Spent $600. Brief thrill, but no lasting financial security gained.',
          'negative'
        );
      } else if (choice === 'loan') {
        soundEngine.playAlert();
        next.cash += 800;
        next.debt += 1600;
        next = prependLog(
          next,
          'Payday loan taken',
          'Received $800 cash now, but added $1,600 in high-interest debt.',
          'negative'
        );
      } else if (choice === 'luxury') {
        if (next.cash < 900) {
          soundEngine.playAlert();
          return prependLog(
            next,
            'Not enough cash',
            `Luxury upgrade costs $900, but you only have ${formatMoney(next.cash)}.`,
            'negative'
          );
        }
        soundEngine.playAlert();
        next.cash -= 900;
        next = prependLog(
          next,
          'Luxury upgrade',
          'Spent $900. Enjoyable—just keep essentials and savings funded first.',
          'warning'
        );
      } else if (choice === 'healthy') {
        if (next.cash < 250) {
          soundEngine.playAlert();
          return prependLog(
            next,
            'Not enough cash',
            `Healthy choice costs $250, but you only have ${formatMoney(next.cash)}.`,
            'negative'
          );
        }
        soundEngine.playCoin();
        next.cash -= 250;
        next = prependLog(
          next,
          'Healthy choice',
          'Invested $250 in nutritious food, fitness, or personal growth.',
          'positive'
        );
      }

      return applyGoalsAndBillsCheck(next);
    });
  };

  const handleBuyStock = (symbol: StockSymbol, shares: number) => {
    if (game.over || shares <= 0) return;
    const stock = game.stocks.find((s) => s.symbol === symbol);
    if (!stock) return;
    const cost = shares * stock.price;
    if (cost > game.cash) {
      soundEngine.playAlert();
      setGame((prev) =>
        prependLog(
          prev,
          'Not enough cash',
          `Buying ${shares} ${symbol} costs ${formatMoney(cost)}, but you have ${formatMoney(prev.cash)}.`,
          'negative'
        )
      );
      return;
    }

    soundEngine.playBuy();
    setGame((prev) => {
      const updated = prependLog(
        {
          ...prev,
          cash: prev.cash - cost,
          holdings: {
            ...prev.holdings,
            [symbol]: (prev.holdings[symbol] || 0) + shares,
          },
        },
        `Bought ${shares} ${symbol}`,
        `Purchased ${shares} shares at ${formatMoney(stock.price)} for ${formatMoney(cost)}.`,
        'neutral'
      );
      return applyGoalsAndBillsCheck(updated);
    });
  };

  const handleSellStock = (symbol: StockSymbol, shares: number) => {
    if (game.over || shares <= 0) return;
    const stock = game.stocks.find((s) => s.symbol === symbol);
    if (!stock) return;

    if ((game.holdings[symbol] || 0) < shares) {
      soundEngine.playAlert();
      setGame((prev) =>
        prependLog(
          prev,
          'Insufficient shares',
          `You do not own ${shares} shares of ${symbol}.`,
          'negative'
        )
      );
      return;
    }

    const proceeds = shares * stock.price;
    soundEngine.playSell();
    setGame((prev) => {
      const updated = prependLog(
        {
          ...prev,
          cash: prev.cash + proceeds,
          holdings: {
            ...prev.holdings,
            [symbol]: Math.max(0, (prev.holdings[symbol] || 0) - shares),
          },
        },
        `Sold ${shares} ${symbol}`,
        `Sold ${shares} shares at ${formatMoney(stock.price)} for ${formatMoney(proceeds)}.`,
        'positive'
      );
      return applyGoalsAndBillsCheck(updated);
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const latestLog = game.history[0];

  return (
    <div className="min-h-[100dvh] bg-[#090e1a] text-slate-100 pb-20 md:pb-10">
      {/* Sticky Top Bar: adheres to 3-zone contract on desktop & <= 48px compact bar on mobile */}
      <header className="sticky top-0 z-30 h-12 md:h-16 border-b border-slate-800/80 bg-[#090e1a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 md:gap-8 px-4 sm:px-6">
          <a
            href="#top"
            className="font-display text-lg md:text-xl font-bold tracking-tight text-cyan-300 whitespace-nowrap shrink-0"
          >
            MoneyQuest
          </a>

          <nav aria-label="Primary sections" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('section-earn')}
              className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Earn &amp; Spend
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('section-market')}
              className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Stock Market
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('section-plan')}
              className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Auto-Plan
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('section-goals')}
              className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Goals &amp; Log
            </button>
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              How to Play
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {isInstalled ? (
              <button
                type="button"
                onClick={restartGame}
                className="min-h-[40px] md:min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3.5 text-xs md:text-sm font-semibold text-slate-950 hover:bg-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>New Game</span>
              </button>
            ) : (
              <PWAInstallButton compact />
            )}
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-7xl px-3.5 sm:px-6 pt-3 sm:pt-5 space-y-4">
        {/* Workspace utility bar: latest action feedback + quick pause/mute/rules controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="min-w-0 flex-1 text-slate-300 truncate">
            {latestLog ? (
              <span>
                <strong
                  className={
                    latestLog.severity === 'positive'
                      ? 'text-emerald-400'
                      : latestLog.severity === 'negative'
                      ? 'text-rose-400'
                      : latestLog.severity === 'warning'
                      ? 'text-amber-400'
                      : 'text-cyan-300'
                  }
                >
                  {latestLog.title}:
                </strong>{' '}
                <span className="text-slate-400">{latestLog.detail}</span>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={game.over}
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? 'Resume game time' : 'Pause game time'}
              className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-xl bg-[#121a2b] border border-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-45 cursor-pointer text-xs font-medium"
            >
              {userPaused ? (
                <Play className="w-4 h-4 text-emerald-400" />
              ) : (
                <Pause className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden sm:inline">{userPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRules(true)}
              aria-label="How to play"
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-[#121a2b] border border-slate-800 text-slate-300 hover:text-slate-100 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-xl bg-[#121a2b] border border-slate-800 text-slate-300 hover:text-slate-100 cursor-pointer text-xs font-medium"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-cyan-300" />
              ) : (
                <Maximize2 className="w-4 h-4 text-cyan-300" />
              )}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit full' : 'Fullscreen'}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-xl bg-[#121a2b] border border-slate-800 text-slate-300 hover:text-slate-100 cursor-pointer text-xs font-medium"
            >
              {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
              <span className="hidden sm:inline">{muted ? 'Muted' : 'Sound on'}</span>
            </button>
          </div>
        </div>

        <VitalsHeaderStrip
          state={game}
          secondsLeft={secondsLeft}
          monthDuration={monthDuration}
          isPaused={effectivePaused}
        />

        {/* Mobile Tabbed Content (< 768px) */}
        <div className="md:hidden">
          {activeTab === 'play' && (
            <EarnAndSpendPanel
              state={game}
              shiftCooldown={shiftCooldown}
              shiftCooldownMax={WORK_SHIFT_COOLDOWN_SECONDS}
              hireCooldown={hireCooldown}
              raiseCooldown={raiseCooldown}
              showMiniGames={false}
              onWorkShift={handleWorkShift}
              onTakeCourse={handleTakeCourse}
              onApplyForHire={handleApplyForHire}
              onAskForRaise={handleAskForRaise}
              onOpenMiniGame={setActiveMiniGame}
              onSpendChoice={handleSpendChoice}
            />
          )}
          {activeTab === 'games' && (
            <SkillMiniGamesCard state={game} onOpenMiniGame={setActiveMiniGame} />
          )}
          {activeTab === 'market' && (
            <StockMarketPanel
              state={game}
              onBuyStock={handleBuyStock}
              onSellStock={handleSellStock}
            />
          )}
          {activeTab === 'plan' && (
            <MonthlyPlanPanel
              state={game}
              plan={plan}
              secondsLeft={secondsLeft}
              monthDuration={monthDuration}
              isPaused={effectivePaused}
              speed={speed}
              onChangePlan={setPlan}
              onTogglePause={() => setUserPaused((p) => !p)}
              onChangeSpeed={handleSpeedChange}
              onRestart={restartGame}
            />
          )}
          {activeTab === 'goals' && <GoalsAndLogPanel state={game} />}
        </div>

        {/* Tablet & Desktop Multi-Column Dashboard (>= 768px) */}
        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          <div id="section-earn">
            <EarnAndSpendPanel
              state={game}
              shiftCooldown={shiftCooldown}
              shiftCooldownMax={WORK_SHIFT_COOLDOWN_SECONDS}
              hireCooldown={hireCooldown}
              raiseCooldown={raiseCooldown}
              onWorkShift={handleWorkShift}
              onTakeCourse={handleTakeCourse}
              onApplyForHire={handleApplyForHire}
              onAskForRaise={handleAskForRaise}
              onOpenMiniGame={setActiveMiniGame}
              onSpendChoice={handleSpendChoice}
            />
          </div>

          <div id="section-market">
            <StockMarketPanel
              state={game}
              onBuyStock={handleBuyStock}
              onSellStock={handleSellStock}
            />
          </div>

          <div id="section-plan" className="md:col-span-2 xl:col-span-1">
            <MonthlyPlanPanel
              state={game}
              plan={plan}
              secondsLeft={secondsLeft}
              monthDuration={monthDuration}
              isPaused={effectivePaused}
              speed={speed}
              onChangePlan={setPlan}
              onTogglePause={() => setUserPaused((p) => !p)}
              onChangeSpeed={handleSpeedChange}
              onRestart={restartGame}
            />
          </div>

          <div id="section-goals" className="md:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GoalsCard state={game} />
              <EventLogCard state={game} />
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Android Thumb-Zone Bottom Tab Bar (< 768px) */}
      <nav
        aria-label="Mobile game navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 bg-[#090e1a]/95 backdrop-blur-md pb-safe"
      >
        <div className="grid grid-cols-5 h-[60px]">
          {(
            [
              { id: 'play', label: 'Play', icon: Wallet },
              { id: 'games', label: 'Games', icon: Gamepad2 },
              { id: 'market', label: 'Market', icon: TrendingUp },
              { id: 'plan', label: 'Plan', icon: CalendarCheck },
              { id: 'goals', label: 'Goals', icon: Target },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors cursor-pointer ${
                  active ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <OfflineIndicator />
      <MiniGameModal
        gameId={activeMiniGame}
        playerCash={game.cash}
        onClose={() => setActiveMiniGame(null)}
        onComplete={handleMiniGameComplete}
      />
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />
      <GameOverModal state={game} onRestart={restartGame} />
      <VictoryModal
        state={game}
        onKeepPlaying={() => setGame((prev) => ({ ...prev, wonAcknowledged: true }))}
        onRestart={restartGame}
      />
    </div>
  );
}
