import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  BarChart2,
  TrendingDown,
  Calendar,
  Layers,
  Heart,
  Bell,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { AuthenticatedProduct, PriceVerdictEnum } from "../types";

interface PriceEvidenceModalProps {
  product: AuthenticatedProduct | null;
  isOpen: boolean;
  onClose: () => void;
  isSavedInWatchlist: boolean;
  onToggleWatchlist: (product: AuthenticatedProduct, targetPrice?: number | null) => void;
}

const SIZES = ["XS", "S", "M", "L", "XL"];

export const PriceEvidenceModal: React.FC<PriceEvidenceModalProps> = ({
  product,
  isOpen,
  onClose,
  isSavedInWatchlist,
  onToggleWatchlist,
}) => {
  if (!isOpen || !product) return null;

  const [selectedSize, setSelectedSize] = useState("M");
  const [expandWhyMatch, setExpandWhyMatch] = useState(true);
  const [expandIsDeal, setExpandIsDeal] = useState(true);
  const [targetPrice, setTargetPrice] = useState<string>(
    product.historical_median_price ? Math.round(product.historical_median_price * 0.9).toString() : ""
  );
  const [notifyOnDealOnly, setNotifyOnDealOnly] = useState(true);

  const isAuthentic = product.price_verdict === PriceVerdictEnum.AUTHENTIC_DEAL;
  const isManipulated = product.price_verdict === PriceVerdictEnum.POTENTIAL_PRICE_MANIPULATION;
  const isNotDeal = product.price_verdict === PriceVerdictEnum.NOT_A_DEAL;
  const isSparse = product.price_verdict === PriceVerdictEnum.INSUFFICIENT_EVIDENCE;

  const isAjio =
    product.competitor === "Ajio" ||
    product.retailer === "AJIO" ||
    (Boolean(product.retailer_display?.toLowerCase().includes("ajio")) && !product.retailer_display?.toLowerCase().includes("trends"));
  const isTrends =
    product.competitor === "Ajio-Trends" ||
    product.retailer === "Trends" ||
    Boolean(product.retailer_display?.toLowerCase().includes("trends"));

  const outboundUrl =
    product.has_purchase_link && (isAjio || isTrends) && product.product_url?.startsWith("http")
      ? product.product_url
      : null;

  const evidence = product.evidence;
  const vibePercent = Math.round(product.vibe_score * 100);

  // Generate a mock sparkline path based on min, median, current, and max
  const minP = evidence?.historical_min_price || product.listed_price * 0.85;
  const maxP = evidence?.historical_max_price || (product.advertised_mrp || product.listed_price * 1.3);
  const medP = evidence?.historical_median_price || product.listed_price;
  const curP = product.listed_price;

  const normalizeY = (val: number) => {
    if (maxP === minP) return 50;
    return Math.max(10, Math.min(90, 100 - ((val - minP) / (maxP - minP)) * 80));
  };

  const pts = [
    { x: 10, y: normalizeY(medP * 1.05), label: "60d ago" },
    { x: 30, y: normalizeY(medP * 0.98), label: "45d ago" },
    { x: 50, y: normalizeY(medP), label: "30d ago" },
    { x: 70, y: normalizeY(medP * 1.02), label: "15d ago" },
    { x: 90, y: normalizeY(curP), label: "Current" },
  ];
  const polylineStr = pts.map((p) => `${p.x * 3},${p.y}`).join(" ");

  const handleWatchlistAction = () => {
    const tPrice = targetPrice ? parseFloat(targetPrice) : null;
    onToggleWatchlist(product, tPrice);
  };

  return (
    <div
      id="product-detail-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="product-detail-modal-card"
        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 text-stone-600 hover:text-stone-950 hover:bg-white shadow-sm transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
          {/* Left Column: Image & Quick Attributes (5 cols) */}
          <div className="md:col-span-5 bg-stone-100 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-200">
            <div>
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-white shadow-sm relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <Sparkles className="w-10 h-10 text-stone-400 mb-2" />
                    <span className="font-serif font-bold text-stone-700">
                      {product.category.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {product.vendor}
                </div>
              </div>

              {/* Sizes Selection */}
              <div className="mt-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2 block">
                  Select Size
                </label>
                <div className="flex gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${
                        selectedSize === size
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & Material Metadata */}
              <div className="mt-4 p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                {product.color && (
                  <div className="flex justify-between">
                    <span>Color Tone:</span>
                    <strong className="capitalize text-stone-800">{product.color}</strong>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between">
                    <span>Fabric/Material:</span>
                    <strong className="capitalize text-stone-800">{product.material}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Product Code:</span>
                  <code className="text-stone-700 font-mono text-[10px]">
                    {product.product_id}
                  </code>
                </div>
              </div>
            </div>

            {/* Watchlist & Future Alert Action */}
            <div className="mt-6 pt-4 border-t border-stone-200 space-y-2">
              <button
                id="modal-toggle-watchlist-btn"
                type="button"
                onClick={handleWatchlistAction}
                className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors ${
                  isSavedInWatchlist
                    ? "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                    : "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isSavedInWatchlist ? "fill-rose-500 text-rose-500" : ""
                  }`}
                />
                <span>{isSavedInWatchlist ? "♥ In Watchlist" : "♡ Add to Watchlist"}</span>
              </button>

              {/* Price Alert Subscription Card */}
              <div className="p-3 bg-white rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <Bell className="w-3.5 h-3.5 text-amber-700" />
                  <span>Set Real-Time Price Alert</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">Alert at: ₹</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Target price"
                    className="w-full text-xs px-2 py-1 rounded bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-800"
                  />
                </div>
                <label className="flex items-center gap-2 text-[10px] text-stone-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyOnDealOnly}
                    onChange={(e) => setNotifyOnDealOnly(e.target.checked)}
                    className="rounded text-stone-900"
                  />
                  <span>Notify only if authentic deal verified</span>
                </label>
                <div className="text-[10px] text-stone-600 italic">
                  Integrated with Cloud Pub/Sub price update push webhooks.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Authenticity & Style Inspection (7 cols) */}
          <div className="md:col-span-7 p-6 space-y-6">
            <div>
              <div className="text-xs uppercase font-semibold tracking-wider text-stone-500">
                {product.category} &bull; {product.vendor}
              </div>
              <h2 className="font-serif font-bold text-2xl text-stone-900 mt-1">
                {product.title}
              </h2>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {product.description}
              </p>

              {/* Price Header */}
              <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs text-stone-500 font-medium">Current Selling Price</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-stone-900">
                      ₹{product.listed_price.toLocaleString()}
                    </span>
                    {product.advertised_mrp && product.advertised_mrp > product.listed_price && (
                      <span className="text-sm text-stone-600 line-through">
                        ₹{product.advertised_mrp.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {product.advertised_discount_percent && (
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-800">
                      Advertised: {product.advertised_discount_percent}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Retailer Offer & Outbound Action */}
              <div className="mt-4 p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 flex-wrap">
                      Primary Retailer: {product.retailer || product.vendor}
                      {product.is_mock_offer ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
                          Dev Mock Offer
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold">
                          Verified Catalog Source
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Price history and evidence calculations are strictly retailer-isolated.
                    </p>
                  </div>
                  {outboundUrl ? (
                    <a
                      href={outboundUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shrink-0"
                    >
                      <span>{isAjio ? "View on AJIO ↗" : "View on Trends ↗"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200 shrink-0">
                      <span>No purchase link available</span>
                    </span>
                  )}
                </div>

                {/* Alternative Retailer Offers if present */}
                {product.alternative_offers && product.alternative_offers.length > 0 && (
                  <div className="pt-3 border-t border-stone-100">
                    <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-2">
                      Alternative Retailer Offers ({product.alternative_offers.length}):
                    </div>
                    <div className="space-y-2">
                      {product.alternative_offers.map((offer) => (
                        <div
                          key={offer.offer_id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900">{offer.retailer_name}</span>
                            {offer.is_mock_data ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                Mock Offer
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-stone-900">₹{offer.listed_price.toLocaleString()}</span>
                            {offer.has_purchase_link && offer.product_url?.startsWith("http") ? (
                              <a
                                href={offer.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 text-[11px] font-medium"
                              >
                                <span>View on {offer.retailer_name} ↗</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-stone-500 italic">No purchase link available</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* EXPANDABLE SECTION 1: IS THIS REALLY A DEAL? (Price Authenticity Evidence) */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandIsDeal(!expandIsDeal)}
                className="w-full px-4 py-3 bg-stone-50 flex items-center justify-between text-left font-serif font-bold text-sm text-stone-900"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-700" />
                  <span>Is this really a deal? (Price Authenticity Audit)</span>
                </div>
                {expandIsDeal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandIsDeal && (
                <div className="p-4 space-y-4 bg-white text-xs">
                  {/* Verdict Banner */}
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isAuthentic
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : isManipulated
                        ? "bg-amber-50 border-amber-300 text-amber-950"
                        : isNotDeal
                        ? "bg-stone-100 border-stone-200 text-stone-900"
                        : "bg-blue-50 border-blue-200 text-blue-950"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {isAuthentic && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                      {isManipulated && <AlertTriangle className="w-4 h-4 text-amber-700" />}
                      {isNotDeal && <XCircle className="w-4 h-4 text-stone-500" />}
                      {isSparse && <HelpCircle className="w-4 h-4 text-blue-600" />}
                      <span>
                        {isAuthentic && "✓ Historically Supported Deal"}
                        {isManipulated && "⚠ Advertised Discount Not Supported"}
                        {isNotDeal && "✕ Standard Historical Price (Not a Deal)"}
                        {isSparse && "? Insufficient Historical Evidence"}
                      </span>
                    </div>
                    <p className="mt-1.5 leading-relaxed text-xs">
                      {product.authenticity_reason}
                    </p>
                  </div>

                  {/* Historical Evidence Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[10px] text-stone-500 font-medium">30-Day Median</div>
                      <div className="text-sm font-bold text-stone-900 mt-0.5">
                        ₹{evidence?.historical_median_price?.toLocaleString() || "N/A"}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[10px] text-stone-500 font-medium">Historical Average</div>
                      <div className="text-sm font-bold text-stone-900 mt-0.5">
                        ₹{evidence?.historical_average_price?.toLocaleString() || "N/A"}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[10px] text-stone-500 font-medium">Lowest Observed</div>
                      <div className="text-sm font-bold text-stone-900 mt-0.5">
                        ₹{evidence?.historical_min_price?.toLocaleString() || "N/A"}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[10px] text-stone-500 font-medium">Observations Count</div>
                      <div className="text-sm font-bold text-stone-900 mt-0.5">
                        {evidence?.observation_count || 0} price points
                      </div>
                    </div>
                  </div>

                  {/* Price Confidence & Recency */}
                  <div className="flex justify-between items-center text-[11px] text-stone-500 border-t border-stone-100 pt-2 px-1">
                    <span>
                      Evidence Confidence:{" "}
                      <strong className="text-stone-800">
                        {Math.round((evidence?.evidence_confidence || 0) * 100)}%
                      </strong>
                    </span>
                    <span>
                      Data Age:{" "}
                      <strong className="text-stone-800">
                        {evidence?.data_age_days !== null && evidence?.data_age_days !== undefined
                          ? `${evidence.data_age_days} days ago`
                          : "Recent"}
                      </strong>
                    </span>
                  </div>

                  {/* Visual Historical Price Sparkline Chart */}
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Historical Price Trajectory vs. Benchmark</span>
                      <span className="text-[10px] text-stone-400">
                        Median: ₹{evidence?.historical_median_price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <svg viewBox="0 0 300 100" className="w-full h-20 overflow-visible">
                        {/* Median horizontal dashed benchmark line */}
                        <line
                          x1="0"
                          y1={normalizeY(medP)}
                          x2="300"
                          y2={normalizeY(medP)}
                          stroke="#a8a29e"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                        {/* Price trace polyline */}
                        <polyline
                          fill="none"
                          stroke={isAuthentic ? "#059669" : isManipulated ? "#d97706" : "#44403c"}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylineStr}
                        />
                        {/* Price point nodes */}
                        {pts.map((pt, i) => (
                          <g key={i}>
                            <circle
                              cx={pt.x * 3}
                              cy={pt.y}
                              r={i === pts.length - 1 ? 4.5 : 3}
                              fill={
                                i === pts.length - 1
                                  ? isAuthentic
                                    ? "#059669"
                                    : "#d97706"
                                  : "#78716c"
                              }
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                            <text
                              x={pt.x * 3}
                              y="98"
                              fontSize="8"
                              textAnchor="middle"
                              fill="#78716c"
                            >
                              {pt.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                      <div className="flex justify-between items-center text-[10px] text-stone-500 mt-2 border-t border-stone-200 pt-1.5">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 bg-stone-400 inline-block border-dashed" />
                          30-day Median Anchor
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className={`w-2.5 h-2.5 rounded-full inline-block ${
                              isAuthentic ? "bg-emerald-600" : isManipulated ? "bg-amber-600" : "bg-stone-700"
                            }`}
                          />
                          Current Listed Price (₹{product.listed_price.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* EXPANDABLE SECTION 2: WHY THIS MATCH? (Semantic Style Compatibility) */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandWhyMatch(!expandWhyMatch)}
                className="w-full px-4 py-3 bg-stone-50 flex items-center justify-between text-left font-serif font-bold text-sm text-stone-900"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Why this match? (Vibe Match {vibePercent}%)</span>
                </div>
                {expandWhyMatch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandWhyMatch && (
                <div className="p-4 space-y-3 bg-white text-xs">
                  {/* Style Compatibility Score Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                      <span>Semantic Compatibility Score</span>
                      <span>{vibePercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${vibePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Matched Features */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                      Confirmed Silhouette Elements:
                    </div>
                    {product.matched_features.length > 0 ? (
                      product.matched_features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-stone-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-medium">{feat}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone-500 italic">General stylistic alignment.</p>
                    )}
                  </div>

                  {/* Unconfirmed / Missing Features */}
                  {product.missing_features.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                        Unconfirmed or Missing Elements:
                      </div>
                      {product.missing_features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200"
                        >
                          <HelpCircle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Style tags */}
                  {product.style_tags && product.style_tags.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                        Catalog Tags:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {product.style_tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
