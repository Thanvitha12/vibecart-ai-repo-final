import React from "react";
import { ShieldCheck, Heart, Sparkles, Bell, Radio } from "lucide-react";
import { ServiceHealth } from "../types";

interface NavbarProps {
  health: ServiceHealth | null;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onOpenSimulator: () => void;
  onResetSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  watchlistCount,
  onOpenWatchlist,
  onOpenSimulator,
  onResetSearch,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Tagline */}
        <button
          id="navbar-brand-btn"
          onClick={onResetSearch}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl text-stone-900 tracking-tight">
                VibeCart <span className="font-sans text-xs uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold tracking-wider">AI</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium hidden sm:block">
              Style Matcher &amp; Price Authenticator
            </p>
          </div>
        </button>

        {/* Right Actions: Health pill, Simulator, Watchlist */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Health Status Indicator */}
          <div
            id="system-health-pill"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800"
            title={`Model: ${health?.model || "gemini-3.8-flash"} | Status: ${health?.status || "healthy"}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Verifier Live</span>
          </div>

          {/* Price Event Simulator Demo Button */}
          <button
            id="open-price-simulator-btn"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors"
            title="Simulate vendor price update event (Pub/Sub flow)"
          >
            <Radio className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Price Alert Simulator</span>
          </button>

          {/* Watchlist Button */}
          <button
            id="navbar-watchlist-btn"
            onClick={onOpenWatchlist}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            aria-label="View saved watchlist"
          >
            <Heart className={`w-4 h-4 ${watchlistCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
            <span className="hidden xs:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span
                id="navbar-watchlist-count"
                className="ml-1 px-1.5 py-0.2 text-xs font-bold rounded-full bg-rose-500 text-white"
              >
                {watchlistCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
