import React, { useEffect, useMemo, useState } from "react";
import { Navbar } from "./components/Navbar";
import { HeroSearch } from "./components/HeroSearch";
import { SearchLoadingState } from "./components/SearchLoadingState";
import { QueryInterpretationBar } from "./components/QueryInterpretationBar";
import { FilterSortToolbar, SortOption } from "./components/FilterSortToolbar";
import { ProductCard } from "./components/ProductCard";
import { PriceEvidenceModal } from "./components/PriceEvidenceModal";
import { WatchlistDrawer } from "./components/WatchlistDrawer";
import { PriceAlertSimulationModal } from "./components/PriceAlertSimulationModal";
import { api } from "./services/api";
import {
  AuthenticatedProduct,
  PriceVerdictEnum,
  ProductQuerySpec,
  RetailerSourceStatus,
  ServiceHealth,
  WatchlistRecord,
} from "./types";
import { AlertCircle, ShoppingBag, Sparkles, RefreshCw, ShieldCheck } from "lucide-react";

export default function App() {
  const [userId] = useState(() => {
    const stored = localStorage.getItem("vibecart_user_id");
    if (stored) return stored;
    const newId = `user_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("vibecart_user_id", newId);
    return newId;
  });

  // Data & State
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<AuthenticatedProduct[]>([]);
  const [results, setResults] = useState<AuthenticatedProduct[]>([]);
  const [normalizedSpec, setNormalizedSpec] = useState<ProductQuerySpec | null>(null);
  const [totalExamined, setTotalExamined] = useState<number>(0);
  const [activeQuery, setActiveQuery] = useState<string>("");
  const [sourceStatuses, setSourceStatuses] = useState<RetailerSourceStatus[]>([]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dealFilter, setDealFilter] = useState<string>("all");
  const [minVibeScore, setMinVibeScore] = useState<number>(0);
  const [sortOption, setSortOption] = useState<SortOption>("best_match");

  // Modals & Drawers
  const [inspectingProduct, setInspectingProduct] = useState<AuthenticatedProduct | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<WatchlistRecord[]>([]);

  // Initial Load: Health, Featured Products, Watchlist
  useEffect(() => {
    async function init() {
      const [h, featured, userWatchlist] = await Promise.all([
        api.getHealth(),
        api.fetchFeaturedProducts(),
        api.getUserWatchlist(userId),
      ]);
      setHealth(h);
      setFeaturedProducts(featured);
      setWatchlist(userWatchlist);
    }
    init();
  }, [userId]);

  // Handle Natural Language Search & Price Authentication
  const handleSearch = async (
    query: string,
    strictDealOnly: boolean,
    imageBase64?: string | null
  ) => {
    setIsLoading(true);
    setError(null);
    setActiveQuery(query);

    try {
      const response = await api.authenticateQuery({
        query,
        strict_deal_only: strictDealOnly,
        image_base64: imageBase64,
      });

      setResults(response.results);
      setNormalizedSpec(response.normalized_query);
      setTotalExamined(response.total_candidates_examined);
      setSourceStatuses(response.source_statuses || []);

      // Reset filters to defaults for new search
      setSelectedCategory("all");
      setDealFilter(strictDealOnly ? "authentic_only" : "all");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while authenticating products.";
      setError(msg);
      setResults([]);
      setSourceStatuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSearch = () => {
    setActiveQuery("");
    setNormalizedSpec(null);
    setResults([]);
    setSourceStatuses([]);
    setError(null);
    setSelectedCategory("all");
    setDealFilter("all");
  };

  // Watchlist Actions
  const handleToggleWatchlist = async (
    product: AuthenticatedProduct,
    targetPrice?: number | null
  ) => {
    const isAlreadySaved = watchlist.some((w) => w.product_id === product.product_id);

    if (isAlreadySaved) {
      await api.removeFromWatchlist(userId, product.product_id);
      setWatchlist((prev) => prev.filter((w) => w.product_id !== product.product_id));
    } else {
      await api.addToWatchlist({
        user_id: userId,
        product_id: product.product_id,
        target_price: targetPrice || null,
        notify_on_authentic_deal_only: true,
      });
      setWatchlist((prev) => [
        ...prev,
        {
          user_id: userId,
          product_id: product.product_id,
          target_price: targetPrice || null,
          notify_on_authentic_deal_only: true,
          created_at: new Date().toISOString(),
          product_title: product.title,
          product_price: product.listed_price,
          vendor: product.vendor,
          image_url: product.image_url,
          price_verdict: product.price_verdict,
        },
      ]);
    }
  };

  const handleRemoveFromWatchlist = async (productId: string) => {
    await api.removeFromWatchlist(userId, productId);
    setWatchlist((prev) => prev.filter((w) => w.product_id !== productId));
  };

  // Available categories derived from displayed pool
  const rawPool = activeQuery ? results : featuredProducts;

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    rawPool.forEach((p) => {
      if (p.category) cats.add(p.category.toLowerCase());
    });
    return Array.from(cats);
  }, [rawPool]);

  // Filter & Sort Pipeline
  const displayedProducts = useMemo(() => {
    let list = [...rawPool];

    // Category Filter
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Deal Filter
    if (dealFilter === "authentic_only") {
      list = list.filter((p) => p.price_verdict === PriceVerdictEnum.AUTHENTIC_DEAL);
    } else if (dealFilter === "flagged_only") {
      list = list.filter((p) => p.price_verdict === PriceVerdictEnum.POTENTIAL_PRICE_MANIPULATION);
    }

    // Minimum Vibe Score Filter
    if (minVibeScore > 0) {
      list = list.filter((p) => p.vibe_score >= minVibeScore);
    }

    // Sorting
    switch (sortOption) {
      case "highest_vibe":
        list.sort((a, b) => b.vibe_score - a.vibe_score);
        break;
      case "best_deal":
        list.sort((a, b) => (b.actual_savings_percent || 0) - (a.actual_savings_percent || 0));
        break;
      case "price_asc":
        list.sort((a, b) => a.listed_price - b.listed_price);
        break;
      case "price_desc":
        list.sort((a, b) => b.listed_price - a.listed_price);
        break;
      case "best_match":
      default:
        list.sort((a, b) => b.final_composite_score - a.final_composite_score);
        break;
    }

    return list;
  }, [rawPool, selectedCategory, dealFilter, minVibeScore, sortOption]);

  const isSaved = (productId: string) => watchlist.some((w) => w.product_id === productId);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation */}
      <Navbar
        health={health}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onResetSearch={handleResetSearch}
      />

      {/* Main Consumer Hero & Search Box */}
      <HeroSearch
        onSearch={handleSearch}
        isLoading={isLoading}
        initialQuery={activeQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State with Consumer-Friendly Sequential Steps */}
        {isLoading && <SearchLoadingState query={activeQuery} />}

        {/* Error Alert State */}
        {!isLoading && error && (
          <div
            id="search-error-alert"
            className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">
              <h4 className="font-bold text-sm">Unable to complete search</h4>
              <p className="text-xs mt-1 leading-normal">{error}</p>
            </div>
            <button
              onClick={() => handleSearch(activeQuery, false)}
              className="px-3 py-1 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg text-xs font-semibold text-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Presentation */}
        {!isLoading && !error && (
          <>
            {/* Normalized Query Understanding Bar (if user searched) */}
            {normalizedSpec && activeQuery && (
              <QueryInterpretationBar
                spec={normalizedSpec}
                resultsCount={displayedProducts.length}
                totalExamined={totalExamined}
                sourceStatuses={sourceStatuses}
                onClearQuery={handleResetSearch}
              />
            )}

            {/* Catalog Section Header (when browsing initial catalog) */}
            {!activeQuery && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200 pb-3">
                <div>
                  <h2 className="font-serif font-bold text-2xl text-stone-900">
                    Featured Catalog
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Browse garments with pre-computed price authenticity audits &amp; 30-day historical medians.
                  </p>
                </div>
                <div className="text-xs text-stone-600">
                  Try the search bar above to test natural language vibe-matching!
                </div>
              </div>
            )}

            {/* Filter and Sorting Toolbar */}
            <FilterSortToolbar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              availableCategories={availableCategories}
              dealFilter={dealFilter}
              onSelectDealFilter={setDealFilter}
              minVibeScore={minVibeScore}
              onSelectMinVibeScore={setMinVibeScore}
              sortOption={sortOption}
              onSelectSortOption={setSortOption}
            />

            {/* Product Cards Grid */}
            {displayedProducts.length > 0 ? (
              <div
                id="products-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    isSavedInWatchlist={isSaved(product.product_id)}
                    onToggleWatchlist={handleToggleWatchlist}
                    onInspectEvidence={(prod) => setInspectingProduct(prod)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div
                id="empty-results-container"
                className="my-16 p-12 bg-white rounded-3xl border border-stone-200 text-center max-w-md mx-auto"
              >
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-4">
                  <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  No matching garments found
                </h3>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  We couldn't find items that match all selected filters or budget constraints. Try loosening
                  budget parameters or selecting "All Items".
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setDealFilter("all");
                    setMinVibeScore(0);
                  }}
                  className="mt-5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  Reset Active Filters
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-200 bg-white py-8 px-4 text-center text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-900">VibeCart AI</span>
            <span>&bull;</span>
            <span>Agentic E-Commerce Price Authenticator &amp; Semantic Vibe Matcher</span>
          </div>
          <div className="text-stone-600 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Multi-Agent Architecture Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>

      {/* Product Detail & Price Evidence Modal */}
      <PriceEvidenceModal
        product={inspectingProduct}
        isOpen={Boolean(inspectingProduct)}
        onClose={() => setInspectingProduct(null)}
        isSavedInWatchlist={inspectingProduct ? isSaved(inspectingProduct.product_id) : false}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* User Saved Watchlist Drawer */}
      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        onRemoveItem={handleRemoveFromWatchlist}
        onSelectProduct={(id) => {
          const prod = rawPool.find((p) => p.product_id === id);
          if (prod) {
            setInspectingProduct(prod);
            setIsWatchlistOpen(false);
          }
        }}
      />

      {/* Price Alert & Pub/Sub Event Simulator Modal */}
      <PriceAlertSimulationModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onPriceUpdated={async () => {
          const featured = await api.fetchFeaturedProducts();
          setFeaturedProducts(featured);
        }}
      />
    </div>
  );
}
