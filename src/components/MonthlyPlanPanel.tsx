import React, { useState } from 'react';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import {
  ESSENTIAL_BILLS,
  calculateMonthlyIncome,
  formatMoney,
} from '../data/gameConfig';
import { GameState, MonthlyPlan } from '../types/game';

interface MonthlyPlanPanelProps {
  state: GameState;
  plan: MonthlyPlan;
  secondsLeft: number;
  monthDuration: number;
  isPaused: boolean;
  speed: 1 | 2;
  onChangePlan: (next: MonthlyPlan) => void;
  onTogglePause: () => void;
  onChangeSpeed: (speed: 1 | 2) => void;
  onRestart: () => void;
}

export const MonthlyPlanPanel: React.FC<MonthlyPlanPanelProps> = ({
  state,
  plan,
  secondsLeft,
  monthDuration,
  isPaused,
  speed,
  onChangePlan,
  onTogglePause,
  onChangeSpeed,
  onRestart,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const monthlyIncome = calculateMonthlyIncome(state.jobLevel, state.raiseBonus);
  const available = state.cash + monthlyIncome - ESSENTIAL_BILLS;
  const totalPlanned = plan.save + plan.pay + plan.invest;
  const cashAfterPlan = available - totalPlanned;
  const overBudget = totalPlanned > available;
  const timeProgress = Math.max(0, Math.min(100, ((monthDuration - secondsLeft) / monthDuration) * 100));

  const updateField = (field: keyof MonthlyPlan, value: number) => {
    const sanitized = Math.max(0, Math.round(value));
    onChangePlan({
      ...plan,
      [field]: sanitized,
    });
  };

  const applyBalancedPreset = () => {
    if (available <= 0) {
      onChangePlan({ save: 0, pay: 0, invest: 0 });
      return;
    }
    const reserve = Math.min(available, 400);
    const budget = Math.max(0, available - reserve);
    const saveTarget = state.emergency < 3000 ? Math.min(250, Math.floor((budget * 0.35) / 50) * 50) : 0;
    const payTarget = state.debt > 0 ? Math.min(state.debt, Math.floor((budget * 0.4) / 50) * 50) : 0;
    const investTarget = Math.max(0, Math.floor(((budget - saveTarget - payTarget) * 0.7) / 50) * 50);
    onChangePlan({
      save: saveTarget,
      pay: payTarget,
      invest: investTarget,
    });
  };

  const handleResetClick = () => {
    if (state.over || state.month === 1) {
      onRestart();
      setConfirmReset(false);
      return;
    }
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3500);
    } else {
      setConfirmReset(false);
      onRestart();
    }
  };

  const rows: Array<{ key: keyof MonthlyPlan; label: string; hint: string }> = [
    { key: 'save', label: 'Emergency-fund transfer', hint: 'Protects against surprise bills' },
    { key: 'pay', label: 'Debt payment', hint: `Remaining debt: ${formatMoney(state.debt)}` },
    { key: 'invest', label: 'Diversified fund', hint: '50% SIF · 20% GGE · 30% TEC/GRN/BND' },
  ];

  return (
    <section className="rounded-2xl bg-[#121a2b] border border-slate-800/90 p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Monthly Auto-Plan</h2>
            <p className="text-xs text-slate-400">Runs automatically as each month passes</p>
          </div>
          <button
            type="button"
            onClick={applyBalancedPreset}
            className="min-h-[38px] px-3 rounded-lg bg-slate-800 text-xs font-semibold text-cyan-300 hover:bg-slate-700 cursor-pointer whitespace-nowrap shrink-0"
          >
            Auto-balance
          </button>
        </div>

        {/* Automatic Time Progression Bar */}
        <div className="mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between gap-2 text-xs mb-2">
            <span className="font-medium text-slate-300">
              {state.over
                ? 'Simulation ended'
                : isPaused
                ? 'Time paused'
                : `Month ${state.month + 1} arrives in `}
              {!state.over && !isPaused && (
                <span className="font-mono font-bold tabular-nums text-cyan-300">
                  {secondsLeft}s
                </span>
              )}
            </span>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
                {([1, 2] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChangeSpeed(s)}
                    className={`min-h-[30px] px-2.5 rounded-md text-[11px] font-mono font-semibold cursor-pointer ${
                      speed === s
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={state.over}
                onClick={onTogglePause}
                aria-label={isPaused ? 'Resume automatic time' : 'Pause automatic time'}
                className="min-h-[34px] px-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-45 cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPaused ? 'bg-amber-400/75' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.max(4, timeProgress)}%` }}
            />
          </div>
        </div>

        <div className="py-2.5 border-b border-slate-800/80 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Current cash + monthly income</span>
            <span className="font-mono tabular-nums font-semibold">
              {formatMoney(state.cash + monthlyIncome)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Essential bills</span>
            <span className="font-mono tabular-nums">-{formatMoney(ESSENTIAL_BILLS)}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-slate-800/60 font-semibold">
            <span className="text-slate-100">Available after bills</span>
            <span
              className={`font-mono tabular-nums ${
                available < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {formatMoney(available)}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <label htmlFor={`plan-${row.key}`} className="text-sm font-medium text-slate-200">
                  {row.label}
                </label>
                <span className="text-[11px] text-slate-400">{row.hint}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Decrease ${row.label}`}
                  onClick={() => updateField(row.key, plan[row.key] - 50)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id={`plan-${row.key}`}
                  type="number"
                  min={0}
                  step={50}
                  value={plan[row.key]}
                  onChange={(e) => updateField(row.key, Number(e.target.value) || 0)}
                  className="w-full min-h-[44px] rounded-xl bg-slate-900 border border-slate-700 px-3 text-center font-mono font-bold tabular-nums text-slate-100 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  aria-label={`Increase ${row.label}`}
                  onClick={() => updateField(row.key, plan[row.key] + 50)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Projected cash after auto-plan</span>
          <span
            className={`font-mono font-bold tabular-nums ${
              overBudget ? 'text-amber-400' : 'text-slate-100'
            }`}
          >
            {formatMoney(Math.max(0, cashAfterPlan))}
          </span>
        </div>

        {overBudget && (
          <p className="text-xs text-amber-400 font-medium">
            Plan exceeds available cash by {formatMoney(totalPlanned - available)}. Allocations will automatically scale down to fit when the month ticks.
          </p>
        )}

        <button
          type="button"
          onClick={handleResetClick}
          className={`w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            confirmReset
              ? 'bg-rose-500 text-white hover:bg-rose-400'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>{confirmReset ? 'Tap again to confirm restart' : 'Restart game'}</span>
        </button>
      </div>
    </section>
  );
};
