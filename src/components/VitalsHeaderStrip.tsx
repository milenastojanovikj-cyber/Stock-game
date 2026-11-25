import React from 'react';
import {
  ESSENTIAL_BILLS,
  JOB_LEVELS,
  calculateInvestedValue,
  calculateMonthlyIncome,
  calculateWellBeingScore,
  formatMoney,
} from '../data/gameConfig';
import { GameState } from '../types/game';

interface VitalsHeaderStripProps {
  state: GameState;
  secondsLeft: number;
  monthDuration: number;
  isPaused: boolean;
}

export const VitalsHeaderStrip: React.FC<VitalsHeaderStripProps> = ({
  state,
  secondsLeft,
  monthDuration,
  isPaused,
}) => {
  const invested = calculateInvestedValue(state.holdings, state.stocks);
  const monthlyIncome = calculateMonthlyIncome(state.jobLevel, state.raiseBonus);
  const score = calculateWellBeingScore(state);
  const jobTitle = JOB_LEVELS[state.jobLevel]?.title ?? 'Part-time';

  const scoreStatus =
    score >= 90 ? 'Thriving' : score >= 70 ? 'Strong' : score >= 45 ? 'Steady' : 'Vulnerable';

  const cashLow = state.cash < 300;
  const timeProgress = Math.max(0, Math.min(100, ((monthDuration - secondsLeft) / monthDuration) * 100));

  return (
    <section
      aria-label="Financial overview"
      className="rounded-2xl bg-[#121a2b] border border-slate-800/90 p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs text-slate-400">
            <span className="font-medium text-cyan-300">Month {state.month}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-300">
              {state.over ? 'Ended' : isPaused ? 'Timer paused' : `Next month in ${secondsLeft}s`}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {jobTitle}
              {state.raiseBonus > 0 ? ` (+${formatMoney(state.raiseBonus)} raises)` : ''}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {formatMoney(monthlyIncome)}/mo in · {formatMoney(ESSENTIAL_BILLS)}/mo bills
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">
              Financial Vitals
            </h2>
            <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden" aria-hidden="true">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isPaused ? 'bg-amber-400/70' : 'bg-cyan-400/80'
                }`}
                style={{ width: `${Math.max(4, timeProgress)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="sm:w-64">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">Well-being · {scoreStatus}</span>
            <span className="font-mono font-bold tabular-nums text-cyan-300">{score} / 100</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-200"
              style={{ width: `${Math.max(2, score)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 pt-4">
        <div>
          <div className="text-xs text-slate-400">Cash on hand</div>
          <div
            className={`mt-0.5 text-xl sm:text-2xl font-mono font-bold tabular-nums ${
              cashLow ? 'text-amber-400' : 'text-slate-100'
            }`}
          >
            {formatMoney(state.cash)}
          </div>
          <div className="text-[11px] text-slate-500">
            {cashLow ? 'Low buffer warning' : 'Liquid balance'}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Emergency fund</div>
          <div className="mt-0.5 text-xl sm:text-2xl font-mono font-bold tabular-nums text-emerald-400">
            {formatMoney(state.emergency)}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">Goal: $3,000</div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Investments</div>
          <div className="mt-0.5 text-xl sm:text-2xl font-mono font-bold tabular-nums text-cyan-300">
            {formatMoney(invested)}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">Goal: $10,000</div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Total debt</div>
          <div
            className={`mt-0.5 text-xl sm:text-2xl font-mono font-bold tabular-nums ${
              state.debt === 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(state.debt)}
          </div>
          <div className="text-[11px] text-slate-500">
            {state.debt === 0 ? 'Debt-free achieved' : 'Goal: $0'}
          </div>
        </div>
      </div>
    </section>
  );
};
