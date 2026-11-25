import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Crosshair,
  FileSearch,
  Layers,
  Play,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { MINI_GAMES, formatMoney } from '../data/gameConfig';
import { MiniGameId } from '../types/game';
import { soundEngine } from '../utils/sound';

interface MiniGameModalProps {
  gameId: MiniGameId | null;
  playerCash: number;
  onClose: () => void;
  onComplete: (netDelta: number, title: string, detail: string) => void;
}

type Phase = 'READY' | 'PLAYING' | 'RESULT';

interface FinalResult {
  netDelta: number;
  headline: string;
  detail: string;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({
  gameId,
  playerCash,
  onClose,
  onComplete,
}) => {
  const [phase, setPhase] = useState<Phase>('READY');
  const [result, setResult] = useState<FinalResult | null>(null);

  useEffect(() => {
    setPhase('READY');
    setResult(null);
  }, [gameId]);

  if (!gameId) return null;

  const meta = MINI_GAMES.find((m) => m.id === gameId);
  if (!meta) return null;

  const canAfford = playerCash >= meta.entryCost;

  const handleFinish = (res: FinalResult) => {
    setResult(res);
    setPhase('RESULT');
    if (res.netDelta > 0) {
      soundEngine.playUpgrade();
    } else if (res.netDelta < 0) {
      soundEngine.playAlert();
    } else {
      soundEngine.playCoin();
    }
  };

  const handleCollect = () => {
    if (!result) {
      onClose();
      return;
    }
    onComplete(result.netDelta, `${meta.title}: ${result.headline}`, result.detail);
    onClose();
  };

  const Icon =
    gameId === 'reflex'
      ? Zap
      : gameId === 'cashier'
      ? Calculator
      : gameId === 'timing'
      ? Crosshair
      : gameId === 'audit'
      ? FileSearch
      : Layers;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="minigame-title"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#121a2b] border border-slate-800 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="minigame-title" className="text-lg font-bold text-slate-100">
                {meta.title}
              </h2>
              <p className="text-xs text-slate-400">
                Stake: {formatMoney(meta.entryCost)} · {meta.rewardHint}
              </p>
            </div>
          </div>

          {phase === 'READY' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close mini-game"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {phase === 'READY' && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">{meta.subtitle}</p>
            <div className="py-3 border-y border-slate-800/80 flex items-center justify-between text-sm">
              <span className="text-slate-400">Entry stake</span>
              <span className="font-mono font-bold tabular-nums text-slate-100">
                {formatMoney(meta.entryCost)}
              </span>
            </div>

            {!canAfford ? (
              <p className="text-xs font-medium text-rose-400">
                You need at least {formatMoney(meta.entryCost)} cash to enter this challenge.
              </p>
            ) : null}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[48px] rounded-xl bg-slate-800 text-slate-200 font-semibold text-sm hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canAfford}
                onClick={() => setPhase('PLAYING')}
                className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-sm hover:bg-cyan-300 disabled:opacity-45 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'PLAYING' && gameId === 'reflex' && (
          <DealHunterGame entryCost={meta.entryCost} onFinish={handleFinish} />
        )}
        {phase === 'PLAYING' && gameId === 'cashier' && (
          <CashierMathGame entryCost={meta.entryCost} onFinish={handleFinish} />
        )}
        {phase === 'PLAYING' && gameId === 'timing' && (
          <PrecisionTimingGame entryCost={meta.entryCost} onFinish={handleFinish} />
        )}
        {phase === 'PLAYING' && gameId === 'audit' && (
          <InvoiceAuditGame entryCost={meta.entryCost} onFinish={handleFinish} />
        )}
        {phase === 'PLAYING' && gameId === 'rebalance' && (
          <AssetSortGame entryCost={meta.entryCost} onFinish={handleFinish} />
        )}

        {phase === 'RESULT' && result && (
          <div className="mt-5 text-center space-y-4">
            <div>
              <div className="text-xs text-slate-400">Net result</div>
              <div
                className={`mt-1 text-3xl font-mono font-bold tabular-nums ${
                  result.netDelta > 0
                    ? 'text-emerald-400'
                    : result.netDelta < 0
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {result.netDelta > 0 ? '+' : ''}
                {formatMoney(result.netDelta)}
              </div>
              <div className="mt-1 text-base font-semibold text-slate-100">{result.headline}</div>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">{result.detail}</p>
            </div>

            <button
              type="button"
              onClick={handleCollect}
              className="w-full min-h-[50px] rounded-xl bg-cyan-400 text-slate-950 font-bold text-sm hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              {result.netDelta >= 0 ? 'Collect & Continue' : 'Accept & Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- 1. Deal Hunter (3x3 Reflex Grid) ---------------- */

type TileKind = 'deal' | 'bonus' | 'fee' | null;

interface TileState {
  kind: TileKind;
  expiresAt: number;
}

const DealHunterGame: React.FC<{
  entryCost: number;
  onFinish: (res: FinalResult) => void;
}> = ({ entryCost, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(12);
  const [gross, setGross] = useState(0);
  const [tiles, setTiles] = useState<TileState[]>(() =>
    Array.from({ length: 9 }, () => ({ kind: null, expiresAt: 0 }))
  );

  const grossRef = useRef(0);
  const hitsRef = useRef(0);
  const feesRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    const countdown = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            const net = Math.max(-entryCost, Math.min(200, grossRef.current - entryCost));
            onFinish({
              netDelta: net,
              headline: net > 0 ? 'Sharp reflexes!' : net === 0 ? 'Broke even' : 'Watch for hidden fees',
              detail: `Collected ${hitsRef.current} deals, hit ${feesRef.current} fee traps. Gross ${formatMoney(grossRef.current)} minus ${formatMoney(entryCost)} stake.`,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const spawner = window.setInterval(() => {
      const now = Date.now();
      setTiles((prev) => {
        const next = prev.map((t) => (t.expiresAt <= now ? { kind: null, expiresAt: 0 } : t));
        const emptyIndices = next
          .map((t, idx) => (t.kind === null ? idx : -1))
          .filter((idx) => idx !== -1);

        if (emptyIndices.length > 0) {
          const pick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const roll = Math.random();
          const kind: TileKind = roll < 0.52 ? 'deal' : roll < 0.72 ? 'bonus' : 'fee';
          next[pick] = { kind, expiresAt: now + 950 };
        }
        return next;
      });
    }, 420);

    return () => {
      window.clearInterval(countdown);
      window.clearInterval(spawner);
    };
  }, [entryCost, onFinish]);

  const handleTapTile = (index: number) => {
    const tile = tiles[index];
    if (!tile.kind) return;

    let delta = 0;
    if (tile.kind === 'deal') {
      delta = 40;
      hitsRef.current += 1;
      soundEngine.playCoin();
    } else if (tile.kind === 'bonus') {
      delta = 75;
      hitsRef.current += 1;
      soundEngine.playBuy();
    } else {
      delta = -50;
      feesRef.current += 1;
      soundEngine.playAlert();
    }

    grossRef.current = Math.max(0, grossRef.current + delta);
    setGross(grossRef.current);
    setTiles((prev) => prev.map((t, idx) => (idx === index ? { kind: null, expiresAt: 0 } : t)));
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Gross collected:{' '}
          <strong className="font-mono tabular-nums text-emerald-400">{formatMoney(gross)}</strong>
        </span>
        <span className="font-mono font-bold tabular-nums text-cyan-300">{timeLeft}s left</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile, idx) => {
          const style =
            tile.kind === 'deal'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
              : tile.kind === 'bonus'
              ? 'bg-cyan-400/20 border-cyan-300 text-cyan-200'
              : tile.kind === 'fee'
              ? 'bg-rose-500/20 border-rose-400 text-rose-300'
              : 'bg-slate-900/90 border-slate-800 text-slate-600';

          const label =
            tile.kind === 'deal'
              ? '+$40'
              : tile.kind === 'bonus'
              ? '+$75'
              : tile.kind === 'fee'
              ? '-$50 Fee'
              : '·';

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleTapTile(idx)}
              className={`min-h-[74px] rounded-xl border font-mono text-sm font-bold tabular-nums transition-transform active:scale-95 cursor-pointer ${style}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- 2. Exact Change Sprint (Mental Math) ---------------- */

interface MathQuestion {
  paid: number;
  price: number;
  answer: number;
  options: number[];
}

function generateQuestions(): MathQuestion[] {
  const paidPool = [20, 50, 100];
  return Array.from({ length: 3 }, () => {
    const paid = paidPool[Math.floor(Math.random() * paidPool.length)];
    const price = 4 + Math.floor(Math.random() * (paid - 8));
    const answer = paid - price;
    const set = new Set<number>([answer]);
    while (set.size < 4) {
      const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
      const candidate = Math.max(1, answer + offset);
      if (candidate !== answer && candidate < paid) {
        set.add(candidate);
      }
    }
    const options = Array.from(set).sort(() => Math.random() - 0.5);
    return { paid, price, answer, options };
  });
}

const CashierMathGame: React.FC<{
  entryCost: number;
  onFinish: (res: FinalResult) => void;
}> = ({ entryCost, onFinish }) => {
  const questions = useMemo(() => generateQuestions(), []);
  const [qIndex, setQIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(18);
  const finishedRef = useRef(false);
  const correctRef = useRef(0);

  const finalize = (finalCorrect: number, timedOut = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const payout =
      finalCorrect === 3 ? 300 : finalCorrect === 2 ? 160 : finalCorrect === 1 ? 75 : 0;
    const net = payout - entryCost;
    onFinish({
      netDelta: net,
      headline:
        finalCorrect === 3
          ? '3/3 Perfect register!'
          : timedOut
          ? `Time up · ${finalCorrect}/3 correct`
          : `${finalCorrect}/3 correct`,
      detail: `Returned ${formatMoney(payout)} on your ${formatMoney(entryCost)} stake.`,
    });
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finalize(correctRef.current, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = questions[qIndex];

  const handleAnswer = (choice: number) => {
    const isCorrect = choice === current.answer;
    const nextCorrect = correctRef.current + (isCorrect ? 1 : 0);
    correctRef.current = nextCorrect;
    setCorrectCount(nextCorrect);

    if (isCorrect) {
      soundEngine.playCoin();
    } else {
      soundEngine.playAlert();
    }

    if (qIndex + 1 >= questions.length) {
      finalize(nextCorrect, false);
    } else {
      setQIndex((i) => i + 1);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Question {qIndex + 1} of 3 ·{' '}
          <strong className="text-emerald-400">{correctCount} correct</strong>
        </span>
        <span className="font-mono font-bold tabular-nums text-cyan-300">{timeLeft}s left</span>
      </div>

      <div className="py-4 border-y border-slate-800 text-center">
        <div className="text-xs text-slate-400">
          Customer pays {formatMoney(current.paid)} for a {formatMoney(current.price)} bill
        </div>
        <div className="mt-1 text-xl font-bold text-slate-100">How much change?</div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {current.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => handleAnswer(opt)}
            className="min-h-[54px] rounded-xl bg-slate-800/90 border border-slate-700 text-lg font-mono font-bold tabular-nums text-slate-100 hover:bg-slate-700 active:scale-[0.98] cursor-pointer"
          >
            {formatMoney(opt)}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- 3. Precision Budget Lock (Skill Timing) ---------------- */

const PrecisionTimingGame: React.FC<{
  entryCost: number;
  onFinish: (res: FinalResult) => void;
}> = ({ entryCost, onFinish }) => {
  const [round, setRound] = useState(1);
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState(10);
  const [lastFeedback, setLastFeedback] = useState<string>('Tap Lock Target inside the green zone');

  const posRef = useRef(10);
  const dirRef = useRef(1);
  const hitsRef = useRef(0);
  const roundRef = useRef(1);

  const halfWidth = round === 1 ? 12 : round === 2 ? 9 : 7;
  const zoneMin = 50 - halfWidth;
  const zoneMax = 50 + halfWidth;

  useEffect(() => {
    let frameId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const speed = roundRef.current === 1 ? 95 : roundRef.current === 2 ? 128 : 160;
      let nextPos = posRef.current + dirRef.current * speed * dt;
      if (nextPos >= 100) {
        nextPos = 100;
        dirRef.current = -1;
      } else if (nextPos <= 0) {
        nextPos = 0;
        dirRef.current = 1;
      }

      posRef.current = nextPos;
      setPos(nextPos);
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleLock = () => {
    const currentPos = posRef.current;
    const hit = currentPos >= zoneMin && currentPos <= zoneMax;
    const nextHits = hitsRef.current + (hit ? 1 : 0);
    hitsRef.current = nextHits;
    setHits(nextHits);

    if (hit) {
      soundEngine.playCoin();
      setLastFeedback('Hit! +$90 locked in');
    } else {
      soundEngine.playAlert();
      setLastFeedback('Missed target zone ($0)');
    }

    if (roundRef.current >= 3) {
      const payout = nextHits * 90;
      const net = payout - entryCost;
      onFinish({
        netDelta: net,
        headline: `${nextHits}/3 targets locked`,
        detail: `Earned ${formatMoney(payout)} across 3 rounds minus ${formatMoney(entryCost)} stake.`,
      });
    } else {
      roundRef.current += 1;
      setRound(roundRef.current);
    }
  };

  return (
    <div className="mt-4 space-y-5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Round {round} of 3 · <strong className="text-emerald-400">{hits} hits</strong>
        </span>
        <span className="text-cyan-300 font-medium">{lastFeedback}</span>
      </div>

      <div className="py-4">
        <div className="relative h-10 w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div
            className="absolute inset-y-0 bg-emerald-500/30 border-x border-emerald-400"
            style={{ left: `${zoneMin}%`, width: `${zoneMax - zoneMin}%` }}
          />
          <div
            className="absolute inset-y-1 w-2 -ml-1 rounded-full bg-cyan-300 shadow"
            style={{ left: `${pos}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-mono text-slate-500">
          <span>0%</span>
          <span className="text-emerald-400">Target {zoneMin}%–{zoneMax}%</span>
          <span>100%</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLock}
        className="w-full min-h-[54px] inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-base active:scale-[0.98] hover:bg-cyan-300 cursor-pointer"
      >
        <Target className="w-5 h-5" />
        <span>Lock Target</span>
      </button>
    </div>
  );
};

/* ---------------- 4. Invoice Audit (Spot the Math Error) ---------------- */

interface AuditRow {
  label: string;
  isError: boolean;
}

interface AuditRound {
  rows: AuditRow[];
}

function generateAuditRounds(): AuditRound[] {
  const items = ['Cloud storage', 'Office paper', 'Transit pass', 'Software seat', 'Design kit', 'Phone line', 'Delivery box', 'Coffee beans'];
  return Array.from({ length: 4 }, () => {
    const picked = [...items].sort(() => Math.random() - 0.5).slice(0, 3);
    const errorIdx = Math.floor(Math.random() * 3);
    const rows = picked.map((name, idx) => {
      const qty = 2 + Math.floor(Math.random() * 5);
      const unit = 4 + Math.floor(Math.random() * 14);
      const exactTotal = qty * unit;
      if (idx === errorIdx) {
        const wrongDelta = (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 6 : 8);
        return {
          label: `${name}: ${qty} × $${unit} = $${exactTotal + wrongDelta}`,
          isError: true,
        };
      }
      return {
        label: `${name}: ${qty} × $${unit} = $${exactTotal}`,
        isError: false,
      };
    });
    return { rows };
  });
}

const InvoiceAuditGame: React.FC<{
  entryCost: number;
  onFinish: (res: FinalResult) => void;
}> = ({ entryCost, onFinish }) => {
  const rounds = useMemo(() => generateAuditRounds(), []);
  const [roundIdx, setRoundIdx] = useState(0);
  const [caught, setCaught] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const caughtRef = useRef(0);
  const finishedRef = useRef(false);

  const finalize = (totalCaught: number, timedOut = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const payout =
      totalCaught === 4 ? 500 : totalCaught === 3 ? 320 : totalCaught === 2 ? 180 : totalCaught === 1 ? 60 : 0;
    const net = payout - entryCost;
    onFinish({
      netDelta: net,
      headline:
        totalCaught === 4
          ? '4/4 Sharp auditor!'
          : timedOut
          ? `Time up · ${totalCaught}/4 errors caught`
          : `${totalCaught}/4 errors caught`,
      detail: `Recovered ${formatMoney(payout)} on your ${formatMoney(entryCost)} stake.`,
    });
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finalize(caughtRef.current, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = rounds[roundIdx];

  const handleSelectRow = (row: AuditRow) => {
    const nextCaught = caughtRef.current + (row.isError ? 1 : 0);
    caughtRef.current = nextCaught;
    setCaught(nextCaught);

    if (row.isError) {
      soundEngine.playCoin();
    } else {
      soundEngine.playAlert();
    }

    if (roundIdx + 1 >= rounds.length) {
      finalize(nextCaught, false);
    } else {
      setRoundIdx((i) => i + 1);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Invoice {roundIdx + 1} of 4 · <strong className="text-emerald-400">{caught} caught</strong>
        </span>
        <span className="font-mono font-bold tabular-nums text-cyan-300">{timeLeft}s left</span>
      </div>

      <div className="text-sm font-semibold text-slate-100">
        Tap the overcharged line item:
      </div>

      <div className="space-y-2.5">
        {current.rows.map((row, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectRow(row)}
            className="w-full min-h-[54px] px-4 rounded-xl bg-slate-800/90 border border-slate-700 text-left font-mono text-sm font-semibold text-slate-100 hover:bg-slate-700 active:scale-[0.98] cursor-pointer"
          >
            {row.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- 5. Asset vs Liability Rush (Speed Sorting) ---------------- */

interface SortCard {
  name: string;
  isAsset: boolean;
}

const SORT_POOL: SortCard[] = [
  { name: 'Index ETF Share', isAsset: true },
  { name: 'Emergency Savings', isAsset: true },
  { name: 'Skills Certificate', isAsset: true },
  { name: 'Treasury Bond', isAsset: true },
  { name: 'Rental Dividend', isAsset: true },
  { name: 'Payday Loan', isAsset: false },
  { name: 'Late Overdraft Fee', isAsset: false },
  { name: 'Impulse Subscription', isAsset: false },
  { name: 'High-Interest Debt', isAsset: false },
  { name: 'Unused Warranty', isAsset: false },
];

const AssetSortGame: React.FC<{
  entryCost: number;
  onFinish: (res: FinalResult) => void;
}> = ({ entryCost, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [scoreCash, setScoreCash] = useState(0);
  const [card, setCard] = useState<SortCard>(() => SORT_POOL[Math.floor(Math.random() * SORT_POOL.length)]);

  const scoreRef = useRef(0);
  const rightRef = useRef(0);
  const wrongRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            const payout = Math.max(0, Math.min(650, scoreRef.current));
            const net = payout - entryCost;
            onFinish({
              netDelta: net,
              headline:
                net > 0
                  ? 'Portfolio balanced!'
                  : net === 0
                  ? 'Broke even'
                  : 'Too many misclassified cards',
              detail: `${rightRef.current} right · ${wrongRef.current} wrong. Payout ${formatMoney(payout)} minus ${formatMoney(entryCost)} stake.`,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [entryCost, onFinish]);

  const handleSort = (pickedAsset: boolean) => {
    const correct = pickedAsset === card.isAsset;
    if (correct) {
      rightRef.current += 1;
      scoreRef.current += 55;
      soundEngine.playCoin();
    } else {
      wrongRef.current += 1;
      scoreRef.current = Math.max(0, scoreRef.current - 65);
      soundEngine.playAlert();
    }
    setScoreCash(scoreRef.current);
    setCard(SORT_POOL[Math.floor(Math.random() * SORT_POOL.length)]);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Earned:{' '}
          <strong className="font-mono tabular-nums text-emerald-400">
            {formatMoney(scoreCash)}
          </strong>
        </span>
        <span className="font-mono font-bold tabular-nums text-cyan-300">{timeLeft}s left</span>
      </div>

      <div className="py-6 px-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
        <div className="text-[11px] text-slate-400">Classify rapidly (+$55 right · -$65 wrong)</div>
        <div className="mt-2 text-xl font-bold text-slate-100">{card.name}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSort(false)}
          className="min-h-[56px] rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold text-sm hover:bg-rose-500/30 active:scale-[0.98] cursor-pointer"
        >
          Liability (Cut)
        </button>
        <button
          type="button"
          onClick={() => handleSort(true)}
          className="min-h-[56px] rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-sm hover:bg-emerald-500/30 active:scale-[0.98] cursor-pointer"
        >
          Asset (Keep)
        </button>
      </div>
    </div>
  );
};
