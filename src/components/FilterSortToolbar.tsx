import React from "react";
import { Filter, ArrowUpDown, ShieldCheck } from "lucide-react";
import { PriceVerdictEnum } from "../types";

export type SortOption = "best_match" | "highest_vibe" | "best_deal" | "price_asc" | "price_desc";

interface FilterSortToolbarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  availableCategories: string[];

  dealFilter: string; // 'all' | 'authentic_only' | 'flagged_only'
  onSelectDealFilter: (filter: string) => void;

  minVibeScore: number;
  onSelectMinVibeScore: (score: number) => void;

  sortOption: SortOption;
  onSelectSortOption: (sort: SortOption) => void;
}

export const FilterSortToolbar: React.FC<FilterSortToolbarProps> = ({
  selectedCategory,
  onSelectCategory,
  availableCategories,
  dealFilter,
  onSelectDealFilter,
  minVibeScore,
  onSelectMinVibeScore,
  sortOption,
  onSelectSortOption,
}) => {
  return (
    <div
      id="filter-sort-toolbar"
      className="bg-white rounded-xl border border-stone-200 p-3 sm:p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs sm:text-sm"
    >
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
        <button
          onClick={() => onSelectCategory("all")}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-stone-900 text-white"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          All Items
        </button>
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap font-medium transition-colors ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter Controls: Deal Status, Vibe Score, Sort Dropdown */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
        {/* Deal Status Filter */}
        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1">
          <ShieldCheck className="w-4 h-4 text-stone-500" />
          <select
            id="deal-status-filter"
            value={dealFilter}
            onChange={(e) => onSelectDealFilter(e.target.value)}
            className="bg-transparent border-none text-stone-800 font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Deal Types</option>
            <option value="authentic_only">✓ Authentic Deals Only</option>
            <option value="flagged_only">⚠ Flagged Discounts</option>
          </select>
        </div>

        {/* Min Vibe Score Slider / Dropdown */}
        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1">
          <span className="text-xs text-stone-500 font-medium">Min Vibe:</span>
          <select
            id="min-vibe-filter"
            value={minVibeScore}
            onChange={(e) => onSelectMinVibeScore(parseFloat(e.target.value))}
            className="bg-transparent border-none text-stone-800 font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value={0}>Any Match</option>
            <option value={0.6}>60%+ Match</option>
            <option value={0.8}>80%+ Match</option>
            <option value={0.9}>90%+ Match</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
          <select
            id="sort-option-select"
            value={sortOption}
            onChange={(e) => onSelectSortOption(e.target.value as SortOption)}
            className="bg-transparent border-none text-stone-800 font-medium text-xs focus:outline-none cursor-pointer"
          >
            <option value="best_match">Sort: Best Match (AI + Deal)</option>
            <option value="highest_vibe">Sort: Highest Vibe Match</option>
            <option value="best_deal">Sort: Biggest Real Savings %</option>
            <option value="price_asc">Sort: Price (Low to High)</option>
            <option value="price_desc">Sort: Price (High to Low)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
