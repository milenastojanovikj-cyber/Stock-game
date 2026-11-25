import React from 'react';
import {
  Briefcase,
  BriefcaseBusiness,
  Clock,
  Gamepad2,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import {
  COURSE_COST,
  JOB_LEVELS,
  MAX_RAISES_PER_JOB,
  MINI_GAMES,
  RAISE_AMOUNT,
  SPENDING_CHOICES,
  calculateHireChance,
  calculateRaiseChance,
  formatMoney,
} from '../data/gameConfig';
import { GameState, MiniGameId, SpendChoiceType } from '../types/game';

interface SkillMiniGamesCardProps {
  state: GameState;
  onOpenMiniGame: (id: MiniGameId) => void;
}

export const SkillMiniGamesCard: React.FC<SkillMiniGamesCardProps> = ({
  state,
  onOpenMiniGame,
}) => {
  return (
    <section className="rounded-2xl bg-[#121a2b] border border-slate-800/90 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="text-lg font-bold text-slate-100">Skill Mini-Games</h2>
        <span className="text-xs text-slate-400">Win or lose by skill</span>
      </div>

      <div className="divide-y divide-slate-800/80">
        {MINI_GAMES.map((mg) => {
          const affordable = state.cash >= mg.entryCost;
          return (
            <button
              key={mg.id}
              type="button"
              disabled={state.over || !affordable}
              onClick={() => onOpenMiniGame(mg.id)}
              className="w-full min-h-[60px] py-3 px-1 flex items-center justify-between gap-3 text-left transition-colors hover:bg-slate-800/40 active:bg-slate-800/60 disabled:opacity-45 cursor-pointer rounded-lg"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Gamepad2 className="w-4 h-4 shrink-0 text-cyan-300" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">{mg.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-snug">{mg.subtitle}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-xs font-semibold tabular-nums text-cyan-300">
                  Stake {formatMoney(mg.entryCost)}
                </div>
                <div className="text-[11px] text-emerald-400 tabular-nums">{mg.rewardHint}</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

interface EarnAndSpendPanelProps {
  state: GameState;
  shiftCooldown: number;
  shiftCooldownMax: number;
  hireCooldown: number;
  raiseCooldown: number;
  showMiniGames?: boolean;
  onWorkShift: () => void;
  onTakeCourse: () => void;
  onApplyForHire: () => void;
  onAskForRaise: () => void;
  onOpenMiniGame: (id: MiniGameId) => void;
  onSpendChoice: (choice: SpendChoiceType) => void;
}

export const EarnAndSpendPanel: React.FC<EarnAndSpendPanelProps> = ({
  state,
  shiftCooldown,
  shiftCooldownMax,
  hireCooldown,
  raiseCooldown,
  showMiniGames = true,
  onWorkShift,
  onTakeCourse,
  onApplyForHire,
  onAskForRaise,
  onOpenMiniGame,
  onSpendChoice,
}) => {
  const shiftEarnings = 80 + state.jobLevel * 40;
  const maxJobReached = state.jobLevel >= JOB_LEVELS.length - 1;
  const nextJob = !maxJobReached ? JOB_LEVELS[state.jobLevel + 1] : null;
  const currentJob = JOB_LEVELS[state.jobLevel] ?? JOB_LEVELS[0];

  const onShiftCooldown = shiftCooldown > 0;
  const shiftProgress = onShiftCooldown
    ? Math.max(0, Math.min(100, ((shiftCooldownMax - shiftCooldown) / shiftCooldownMax) * 100))
    : 100;

  const hireChance = calculateHireChance(state.skills, state.experience);
  const raiseChance = calculateRaiseChance(state.skills, state.experience);
  const maxRaisesReached = state.raisesAtCurrentJob >= MAX_RAISES_PER_JOB;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[#121a2b] border border-slate-800/90 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="text-lg font-bold text-slate-100">Make Money &amp; Career</h2>
          <span className="text-xs text-slate-400 tabular-nums">
            {state.experience} shifts · {state.skills} skills
          </span>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            disabled={state.over || onShiftCooldown}
            onClick={onWorkShift}
            className={`relative overflow-hidden w-full min-h-[52px] flex items-center justify-between gap-3 rounded-xl px-4 py-3 font-semibold transition-transform active:scale-[0.98] ${
              onShiftCooldown || state.over
                ? 'bg-slate-800/80 border border-slate-700/80 text-slate-300 cursor-not-allowed'
                : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 cursor-pointer'
            }`}
          >
            {onShiftCooldown && !state.over && (
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-cyan-400/15 transition-all duration-300"
                style={{ width: `${shiftProgress}%` }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2.5 text-sm sm:text-base whitespace-nowrap">
              {onShiftCooldown ? (
                <Clock className="w-4 h-4 shrink-0 text-cyan-300" />
              ) : (
                <Briefcase className="w-4 h-4 shrink-0" />
              )}
              {onShiftCooldown ? 'Work shift recharging' : 'Do a work shift'}
            </span>
            <span className="relative z-10 font-mono font-bold tabular-nums text-sm sm:text-base whitespace-nowrap">
              {onShiftCooldown ? `${shiftCooldown}s` : `+${formatMoney(shiftEarnings)}`}
            </span>
          </button>

          <button
            type="button"
            disabled={state.over}
            onClick={onTakeCourse}
            className="w-full min-h-[52px] flex items-center justify-between gap-3 rounded-xl bg-slate-800/90 border border-slate-700/80 px-4 py-3 text-slate-100 font-medium transition-transform active:scale-[0.98] hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <span className="flex items-center gap-2.5 text-left">
              <GraduationCap className="w-4 h-4 shrink-0 text-cyan-300" />
              <span>
                <span className="block text-sm font-semibold">Take a skills course</span>
                <span className="block text-xs text-slate-400">
                  Boosts hire (+30%) &amp; raise (+10%) odds
                </span>
              </span>
            </span>
            <span className="font-mono font-semibold tabular-nums text-sm text-slate-300 whitespace-nowrap">
              -{formatMoney(COURSE_COST)}
            </span>
          </button>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2 text-xs text-slate-400">
            <span>Current role: <strong className="text-slate-200">{currentJob.title}</strong></span>
            <span className="font-mono tabular-nums text-slate-300">
              {formatMoney(currentJob.income + state.raiseBonus)}/mo
            </span>
          </div>

          <button
            type="button"
            disabled={state.over || maxJobReached || hireCooldown > 0}
            onClick={onApplyForHire}
            className="w-full min-h-[52px] flex items-center justify-between gap-3 rounded-xl bg-slate-800/90 border border-slate-700/80 px-4 py-3 text-slate-100 font-medium transition-transform active:scale-[0.98] hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <span className="flex items-center gap-2.5 text-left">
              <BriefcaseBusiness className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <span className="block text-sm font-semibold">
                  {maxJobReached
                    ? 'Top career role reached'
                    : hireCooldown > 0
                    ? 'Application cooling down'
                    : `Apply for hire: ${nextJob?.title}`}
                </span>
                <span className="block text-xs text-slate-400">
                  {maxJobReached
                    ? 'Maximum base job tier unlocked'
                    : `${hireChance}% interview odds · Base ${formatMoney(nextJob?.income ?? 0)}/mo`}
                </span>
              </span>
            </span>
            <span className="font-mono font-semibold tabular-nums text-xs sm:text-sm text-emerald-400 whitespace-nowrap">
              {maxJobReached ? 'Max' : hireCooldown > 0 ? `${hireCooldown}s` : 'Apply'}
            </span>
          </button>

          <button
            type="button"
            disabled={state.over || maxRaisesReached || raiseCooldown > 0}
            onClick={onAskForRaise}
            className="w-full min-h-[52px] flex items-center justify-between gap-3 rounded-xl bg-slate-800/90 border border-slate-700/80 px-4 py-3 text-slate-100 font-medium transition-transform active:scale-[0.98] hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <span className="flex items-center gap-2.5 text-left">
              <TrendingUp className="w-4 h-4 shrink-0 text-cyan-300" />
              <span>
                <span className="block text-sm font-semibold">
                  {maxRaisesReached
                    ? 'Max raises for this role'
                    : raiseCooldown > 0
                    ? 'Raise review cooling down'
                    : 'Ask for a raise'}
                </span>
                <span className="block text-xs text-slate-400">
                  {maxRaisesReached
                    ? 'Get hired into a higher role for more raises'
                    : `${raiseChance}% approval odds · ${state.raisesAtCurrentJob}/${MAX_RAISES_PER_JOB} raises used`}
                </span>
              </span>
            </span>
            <span className="font-mono font-semibold tabular-nums text-xs sm:text-sm text-cyan-300 whitespace-nowrap">
              {maxRaisesReached
                ? 'Cap'
                : raiseCooldown > 0
                ? `${raiseCooldown}s`
                : `+${formatMoney(RAISE_AMOUNT)}/mo`}
            </span>
          </button>
        </div>
      </section>

      {showMiniGames && (
        <SkillMiniGamesCard state={state} onOpenMiniGame={onOpenMiniGame} />
      )}

      <section className="rounded-2xl bg-[#121a2b] border border-slate-800/90 p-4 sm:p-5">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-slate-100">Spending Choices</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Weigh short-term wants against long-term financial security.
          </p>
        </div>

        <div className="divide-y divide-slate-800/80">
          {SPENDING_CHOICES.map((choice) => {
            const toneClass =
              choice.tone === 'positive'
                ? 'text-emerald-400'
                : choice.tone === 'warning'
                ? 'text-amber-400'
                : 'text-rose-400';

            return (
              <button
                key={choice.id}
                type="button"
                disabled={state.over}
                onClick={() => onSpendChoice(choice.id)}
                className="w-full min-h-[60px] py-3 px-1 flex items-center justify-between gap-3 text-left transition-colors hover:bg-slate-800/40 active:bg-slate-800/60 disabled:opacity-45 cursor-pointer rounded-lg"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">{choice.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {choice.description}
                  </div>
                </div>
                <div className={`font-mono text-xs font-semibold tabular-nums shrink-0 text-right ${toneClass}`}>
                  {choice.costLabel}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
