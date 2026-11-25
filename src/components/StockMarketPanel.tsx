import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, Plus } from 'lucide-react';
import { calculateInvestedValue, formatMoney } from '../data/gameConfig';
import { GameState, StockSymbol } from '../types/game';
import { Sparkline } from './Sparkline';

interface StockMarketPanelProps {
  state: GameState;
  onBuyStock: (symbol: StockSymbol, shares: number) => void;
  onSellStock: (symbol: StockSymbol, shares: number) => void;
}

type MarketFilter = 'all' | 'growth' | 'owned';

export const StockMarketPanel: React.FC<StockMarketPanelProps> = ({
  state,
  onBuyStock,
  onSellStock,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<StockSymbol>('SIF');
  const [filter, setFilter] = useState<MarketFilter>('all');
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [sharesInput, setSharesInput] = useState<number>(1);

  const visibleStocks = useMemo(() => {
    if (filter === 'growth') {
      return state.stocks.filter((s) => s.drift >= 0.014);
    }
    if (filter === 'owned') {
      return state.stocks.filter((s) => (state.holdings[s.symbol] || 0) > 0);
    }
    return state.stocks;
  }, [filter, state.stocks, state.holdings]);

  const selectedStock = state.stocks.find((s) => s.symbol === selectedSymbol) ?? state.stocks[0];
  const ownedShares = state.holdings[selectedStock.symbol] || 0;
  const maxBuyable = Math.floor(state.cash / selectedStock.price);
  const maxSellable = Math.floor(ownedShares);
  const estimatedValue = sharesInput * selectedStock.price;
  const totalPortfolioValue = calculateInvestedValue(state.holdings, state.stocks);

  const handleQuickAmount = (qty: number | 'max') => {
    if (qty === 'max') {
      const cap = tradeMode === 'buy' ? Math.max(1, maxBuyable) : Math.max(1, maxSellable);
      setSharesInput(cap);
    } else {
      setSharesInput(qty);
    }
  };

  const handleExecute = () => {
    const qty = Math.max(1, Math.floor(sharesInput || 0));
    if (tradeMode === 'buy') {
      onBuyStock(selectedStock.symbol, qty);
    } else {
      onSellStock(selectedStock.symbol, qty);
    }
  };

  return (
    <section className="rounded-2xl bg-[#121a2b] border border-slate-800/90 p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Stock Market</h2>
            <p className="text-xs text-slate-400 tabular-nums">
              Portfolio: {formatMoney(totalPortfolioValue)} · {state.stocks.length} stocks
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'growth', label: 'High growth' },
                { id: 'owned', label: 'Owned' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[34px] px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[340px] overflow-y-auto pr-1 divide-y divide-slate-800/80">
          {visibleStocks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No shares owned yet. Select a stock from All or High growth to invest.
            </div>
          ) : (
            visibleStocks.map((stock) => {
              const isSelected = stock.symbol === selectedStock.symbol;
              const held = state.holdings[stock.symbol] || 0;
              const heldValue = held * stock.price;
              const pctChange =
                stock.previousPrice > 0
                  ? ((stock.price - stock.previousPrice) / stock.previousPrice) * 100
                  : 0;
              const isUp = pctChange >= 0;

              return (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => setSelectedSymbol(stock.symbol)}
                  className={`w-full min-h-[60px] py-2.5 px-2.5 flex items-center justify-between gap-3 text-left rounded-xl transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-400/10 ring-1 ring-inset ring-cyan-400/40'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-cyan-300 shrink-0">
                        {stock.symbol}
                      </span>
                      <span className="text-sm font-medium text-slate-100 truncate">
                        {stock.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                      {stock.riskLabel}
                      <span aria-hidden="true"> · </span>
                      {held > 0 ? `${held.toFixed(2)} sh (${formatMoney(heldValue)})` : '0 shares'}
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <Sparkline data={stock.history} positive={isUp} />
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-bold tabular-nums text-slate-100">
                      {formatMoney(stock.price)}
                    </div>
                    <div
                      className={`inline-flex items-center gap-0.5 font-mono text-xs tabular-nums ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {isUp ? '+' : ''}
                      {pctChange.toFixed(1)}%
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-slate-400">Selected fund</div>
            <div className="text-sm font-semibold text-slate-100">
              {selectedStock.symbol} · {formatMoney(selectedStock.price)}/share
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setTradeMode('buy')}
              className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tradeMode === 'buy'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setTradeMode('sell')}
              className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tradeMode === 'sell'
                  ? 'bg-slate-200 text-slate-950'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease share quantity"
            onClick={() => setSharesInput((v) => Math.max(1, v - 1))}
            className="min-h-[46px] min-w-[46px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min={1}
            value={sharesInput}
            onChange={(e) => setSharesInput(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            aria-label="Share quantity"
            className="w-full min-h-[46px] rounded-xl bg-slate-900 border border-slate-700 px-3 text-center font-mono font-bold tabular-nums text-slate-100 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            aria-label="Increase share quantity"
            onClick={() => setSharesInput((v) => v + 1)}
            className="min-h-[46px] min-w-[46px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {([1, 5, 10, 'max'] as const).map((preset) => (
            <button
              key={String(preset)}
              type="button"
              onClick={() => handleQuickAmount(preset)}
              className="min-h-[40px] rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
            >
              {preset === 'max' ? 'Max' : `${preset} sh`}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={
            state.over ||
            (tradeMode === 'buy' && estimatedValue > state.cash) ||
            (tradeMode === 'sell' && ownedShares < sharesInput)
          }
          onClick={handleExecute}
          className={`w-full min-h-[48px] flex items-center justify-between px-4 rounded-xl font-semibold text-sm transition-transform active:scale-[0.98] disabled:opacity-45 cursor-pointer ${
            tradeMode === 'buy'
              ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
              : 'bg-slate-200 text-slate-950 hover:bg-white'
          }`}
        >
          <span>
            {tradeMode === 'buy' ? `Buy ${sharesInput} ${selectedStock.symbol}` : `Sell ${sharesInput} ${selectedStock.symbol}`}
          </span>
          <span className="font-mono font-bold tabular-nums">
            {formatMoney(estimatedValue)}
          </span>
        </button>
      </div>
    </section>
  );
};
