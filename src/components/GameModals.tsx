import React from 'react';
import { Award, HelpCircle, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { calculateNetWorth, calculateWellBeingScore, formatMoney } from '../data/gameConfig';
import { GameState } from '../types/game';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#121a2b] border border-slate-800 p-6 shadow-2xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-cyan-300" />
            <h2 id="rules-title" className="text-xl font-bold text-slate-100">
              How to Play MoneyQuest
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-300 leading-relaxed">
          <div>
            <h3 className="font-semibold text-slate-100">1. Objective</h3>
            <p className="mt-1 text-slate-400">
              Reach a <strong className="text-cyan-300">90+ well-being score</strong> by building a $3,000 emergency fund, paying off your $5,000 starting debt, and growing $10,000 in investments—without running out of cash.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-100">2. Boost Your Income</h3>
            <p className="mt-1 text-slate-400">
              Work extra shifts once every 20 seconds for immediate cash and experience, take skills courses ($300) to improve your odds, then apply to get hired into higher-paying roles or ask for raises (+$150/mo each).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-100">3. Auto-Time &amp; Monthly Plan</h3>
            <p className="mt-1 text-slate-400">
              Months pass automatically on a live timer—no clicking required. Set your automatic emergency savings, debt payment, and diversified investment plan, or trade individual stocks anytime. Watch out for surprise expenses; your emergency fund shields you when they hit.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-100">4. Skill Mini-Games &amp; Traps</h3>
            <p className="mt-1 text-slate-400">
              Test your reflexes, math, and timing in skill mini-games to earn extra cash—but mistaps and missed targets can cost your entry stake. Avoid payday loans and impulse spending that drain your $1,500 monthly bill buffer.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full min-h-[48px] rounded-xl bg-cyan-400 text-slate-950 font-bold text-sm hover:bg-cyan-300 transition-colors cursor-pointer"
        >
          Back to Game
        </button>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ state, onRestart }) => {
  if (!state.over) return null;

  const finalScore = calculateWellBeingScore(state);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#121a2b] border border-rose-500/40 p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 id="gameover-title" className="mt-4 text-2xl font-bold text-rose-400">
          Game Over: Out of Money
        </h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          You ran out of cash and could not cover your essential bills. In real life, a setback is not the end of your story—regroup, build a safety buffer early, and try a new strategy.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-center">
          <div>
            <div className="text-[11px] text-slate-400">Months</div>
            <div className="font-mono font-bold tabular-nums text-slate-100">{state.month}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Peak net worth</div>
            <div className="font-mono font-bold tabular-nums text-slate-100">
              {formatMoney(state.peakNetWorth)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Final score</div>
            <div className="font-mono font-bold tabular-nums text-slate-100">{finalScore}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="mt-6 w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-base hover:bg-cyan-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  state: GameState;
  onKeepPlaying: () => void;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  state,
  onKeepPlaying,
  onRestart,
}) => {
  if (!state.goals.win || state.wonAcknowledged || state.over) return null;

  const netWorth = calculateNetWorth(state);
  const score = calculateWellBeingScore(state);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#121a2b] border border-emerald-400/40 p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-400">
          <Award className="w-7 h-7" />
        </div>
        <h2 id="victory-title" className="mt-4 text-2xl font-bold text-emerald-400">
          You Win MoneyQuest!
        </h2>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          You reached a {score} well-being score in Month {state.month} and built a resilient financial foundation.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 py-3 border-y border-slate-800">
          <div>
            <div className="text-[11px] text-slate-400">Net worth</div>
            <div className="font-mono font-bold tabular-nums text-emerald-300">
              {formatMoney(netWorth)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Well-being score</div>
            <div className="font-mono font-bold tabular-nums text-cyan-300">{score} / 100</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onKeepPlaying}
            className="flex-1 min-h-[48px] rounded-xl bg-cyan-400 text-slate-950 font-bold text-sm hover:bg-cyan-300 transition-colors cursor-pointer"
          >
            Keep playing
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 min-h-[48px] rounded-xl bg-slate-800 text-slate-100 font-semibold text-sm hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  );
};
