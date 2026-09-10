import React from "react";
import { X, Heart, Trash2, ExternalLink, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react";
import { PriceVerdictEnum, WatchlistRecord } from "../types";

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistRecord[];
  onRemoveItem: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  watchlist,
  onRemoveItem,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="watchlist-drawer-backdrop"
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        id="watchlist-drawer-panel"
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="font-serif font-bold text-lg text-stone-900">
              Saved Watchlist ({watchlist.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close watchlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Watchlist Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {watchlist.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Heart className="w-12 h-12 text-stone-300 stroke-[1.5] mb-3" />
              <p className="font-medium text-stone-700 text-sm">Your watchlist is empty</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                Tap the heart icon on any product card to track its authentic price deal status.
              </p>
            </div>
          ) : (
            watchlist.map((item) => {
              const isAuthentic = item.price_verdict === PriceVerdictEnum.AUTHENTIC_DEAL;
              const isManipulated = item.price_verdict === PriceVerdictEnum.POTENTIAL_PRICE_MANIPULATION;

              return (
                <div
                  key={item.product_id}
                  id={`watchlist-item-${item.product_id}`}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white hover:border-stone-300 transition-all flex items-start gap-3 justify-between"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectProduct(item.product_id)}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                      {item.vendor || "Catalog Item"} &bull; {item.product_id}
                    </div>
                    <h4 className="font-medium text-sm text-stone-900 line-clamp-1 mt-0.5">
                      {item.product_title || item.product_id}
                    </h4>

                    <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                      {item.product_price && (
                        <span className="font-bold text-stone-900">
                          ₹{item.product_price.toLocaleString()}
                        </span>
                      )}

                      {/* Verdict Badge */}
                      {isAuthentic && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Authentic Deal
                        </span>
                      )}
                      {isManipulated && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          ⚠ Flagged Discount
                        </span>
                      )}
                    </div>

                    {item.target_price && (
                      <div className="mt-1.5 text-[11px] text-stone-600">
                        Target Alert: <strong className="text-stone-800">₹{item.target_price.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <button
                      onClick={() => onRemoveItem(item.product_id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectProduct(item.product_id)}
                      className="p-1.5 text-stone-400 hover:text-stone-800 rounded hover:bg-stone-100 transition-colors"
                      title="Inspect price evidence"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 text-[11px] text-stone-500 text-center">
          Persisted via backend API. Backed by Google Cloud Firestore.
        </div>
      </div>
    </div>
  );
};
