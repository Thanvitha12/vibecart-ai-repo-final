import React, { useState } from "react";
import { Search, Sparkles, Image as ImageIcon, CheckCircle2, SlidersHorizontal, ArrowRight, X } from "lucide-react";

interface HeroSearchProps {
  onSearch: (query: string, strictDealOnly: boolean, imageBase64?: string | null) => void;
  isLoading: boolean;
  initialQuery?: string;
}

const EXAMPLE_SEARCHES = [
  {
    label: "Flagship Demo",
    query: "Find me a dress under ₹2500 with a pot neck, dori ties at the back and rhombus-shaped ruffles. Only show me genuine deals.",
    badge: "Judge Recommended",
  },
  {
    label: "Black Puff Sleeves",
    query: "Black dress with puff sleeves under ₹2000",
  },
  {
    label: "Mirror Work Anarkali",
    query: "Festive anarkali with mirror work under ₹3000",
  },
  {
    label: "Back Tie Top",
    query: "Top with unusual back design and tie details",
  },
];

export const HeroSearch: React.FC<HeroSearchProps> = ({
  onSearch,
  isLoading,
  initialQuery = "",
}) => {
  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [strictDealOnly, setStrictDealOnly] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() && !selectedImage) return;
    onSearch(inputQuery.trim(), strictDealOnly, selectedImage);
  };

  const handleExampleClick = (exampleQuery: string) => {
    setInputQuery(exampleQuery);
    onSearch(exampleQuery, strictDealOnly, selectedImage);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageName(null);
  };

  return (
    <div className="relative bg-gradient-to-b from-stone-50 to-stone-100/60 border-b border-stone-200 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Value Proposition Headline */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
          Find what you want. <br className="hidden sm:inline" />
          <span className="text-stone-700">Know what you're actually saving.</span>
        </h1>

        <p className="mt-3 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto">
          Describe complex fashion silhouettes in plain words. VibeCart verifies semantic style match
          and audits advertised discounts against 30-day historical price medians.
        </p>

        {/* Search Box Form */}
        <form onSubmit={handleSubmit} className="mt-8 relative max-w-3xl mx-auto">
          <div className="relative flex flex-col sm:flex-row items-stretch rounded-2xl bg-white shadow-lg shadow-stone-200/70 border border-stone-300 p-1.5 focus-within:border-stone-800 focus-within:ring-2 focus-within:ring-stone-800/10 transition-all">
            <div className="flex items-center flex-1 px-3 py-2">
              <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
              <input
                id="search-input"
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Try: pot neck back design with dori ties and rhombus-shaped ruffles under ₹2500"
                className="w-full text-stone-900 placeholder-stone-400 text-sm sm:text-base bg-transparent border-none focus:outline-none"
                disabled={isLoading}
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => setInputQuery("")}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Actions: Image upload toggle & Submit */}
            <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0 justify-end border-t sm:border-t-0 sm:border-l border-stone-100 pt-2 sm:pt-0">
              <button
                type="button"
                id="toggle-moodboard-btn"
                onClick={() => setShowImageUpload(!showImageUpload)}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  showImageUpload || selectedImage
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                }`}
                title="Attach style screenshot or moodboard"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden md:inline">Moodboard</span>
              </button>

              <button
                id="search-submit-btn"
                type="submit"
                disabled={isLoading || (!inputQuery.trim() && !selectedImage)}
                className="px-5 py-3 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </span>
                ) : (
                  <>
                    <span>Authenticate</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Optional Image Moodboard Attachment Drawer */}
          {showImageUpload && (
            <div
              id="moodboard-attachment-panel"
              className="mt-3 p-3 bg-white rounded-xl border border-stone-200 text-left flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 text-stone-600">
                <ImageIcon className="w-4 h-4 text-amber-700" />
                <span>Upload screenshot or visual reference for multimodal style grounding:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedImage ? (
                  <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                    <span className="font-medium text-stone-800 truncate max-w-[150px]">
                      {imageName || "Moodboard attached"}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer bg-stone-900 text-white hover:bg-stone-800 px-3 py-1.5 rounded-lg font-medium transition-colors">
                    <span>Select Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Strict Deal Toggle */}
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs text-stone-600 px-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="strict-deal-checkbox"
                type="checkbox"
                checked={strictDealOnly}
                onChange={(e) => setStrictDealOnly(e.target.checked)}
                className="w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-stone-800"
              />
              <span className="font-medium text-stone-700">
                Strict: Only show verified authentic deals (filter out fake markups)
              </span>
            </label>

            <span className="text-stone-600 hidden sm:inline">
              Audited against 30-day historical medians
            </span>
          </div>
        </form>

        {/* Quick Example Searches */}
        <div className="mt-6 text-left max-w-3xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
            Example Scenarios:
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SEARCHES.map((ex, idx) => (
              <button
                key={idx}
                id={`example-search-${idx}`}
                onClick={() => handleExampleClick(ex.query)}
                className={`text-xs px-3 py-1.5 rounded-full border text-stone-700 transition-all flex items-center gap-1.5 ${
                  ex.badge
                    ? "bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100 font-medium"
                    : "bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                }`}
              >
                <span>{ex.label}</span>
                {ex.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-200 text-amber-900 font-bold uppercase">
                    {ex.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
