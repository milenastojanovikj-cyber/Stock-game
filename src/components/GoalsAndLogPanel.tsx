import React from 'react';
import { AlertTriangle, CheckCircle2, Circle, Info, TrendingDown, TrendingUp } from 'lucide-react';
import {
  calculateInvestedValue,
  calculateWellBeingScore,
  formatMoney,
} from '../data/gameConfig';
import { GameState, LogSeverity } from '../types/game';

interface GoalsAndLogPanelProps {
  state: GameState;
}

function severityIcon(severity: LogSeverity) {
  switch (severity) {
    case 'positive':
      return <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
    case 'negative':
      return <TrendingDown className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
    default:
      return <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />;
  }
}

export const GoalsCard: React.FC<{ state: GameState }> = ({ state }) => {
  const invested = calculateInvestedValue(state.holdings, state.stocks);
  const score = calculateWellBeingScore(state);

  const goals = [
    {
      label: 'Emergency fund: $3,000',
      currentText: `${formatMoney(state.emergency)} / $3,000`,
      progress: Math.min(100, (state.emergency / 3000) * 100),
      done: state.emergency >= 3000,
    },
    {
      label: 'Become debt-free',
      currentText: state.debt === 0 ? 'Cleared' : `${formatMoney(state.debt)} left`,
      progress: state.debt === 0 ? 100 : Math.max(0, Math.min(100, (1 - state.debt / 5000) * 100)),
      done: state.debt === 0,
    },
    {
      label: 'Investments reach $10,000',
      currentText: `${formatMoney(invested)} / $10,000`,
      progress: Math.min(100, (invested / 10000) * 100),
      done: invested >= 10000,
    },
    {
      label: 'Reach 90 well-being score',
      currentText: `${score} / 90`,
      progress: Math.min(100, (score / 90) * 100),
      done: score >= 90,
    },
  ];

  return (
    <section className="rounded-2xl bg-[#121a2b] border border-slate-800/90 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="text-lg font-bold text-slate-100">Financial Goals</h2>
        <span className="text-xs text-slate-400 tabular-nums">
          {goals.filter((g) => g.done).length} of 4 complete
        </span>
      </div>

      <div className="space-y-3.5">
        {goals.map((goal) => (
          <div key={goal.label}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-200">
                {goal.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className={goal.done ? 'text-emerald-300' : 'text-slate-200'}>
                  {goal.label}
                </span>
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-400">
                {goal.currentText}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  goal.done ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.max(2, goal.progress)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
        Score formula: 30% emergency fund · 25% debt freedom · 25% investments · 20% cash buffer.
      </div>
    </section>
  );
};

export const EventLogCard: React.FC<{ state: GameState }> = ({ state }) => {
  return (
    <section className="rounded-2xl bg-[#121a2b] border border-slate-800/90 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="text-lg font-bold text-slate-100">Event Log</h2>
        <span className="text-xs text-slate-400 tabular-nums">
          {state.history.length} entries
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto pr-1 divide-y divide-slate-800/70">
        {state.history.map((entry) => (
          <div key={entry.id} className="py-2.5 flex items-start gap-2.5 text-sm">
            {severityIcon(entry.severity)}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-slate-100">{entry.title}</span>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
                  M{entry.month}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{entry.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const GoalsAndLogPanel: React.FC<GoalsAndLogPanelProps> = ({ state }) => {
  return (
    <div className="space-y-4">
      <GoalsCard state={state} />
      <EventLogCard state={state} />
    </div>
  );
};
