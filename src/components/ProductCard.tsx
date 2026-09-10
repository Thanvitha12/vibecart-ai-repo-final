import React from "react";
import {
  Heart,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  ExternalLink,
  Sparkles,
  BarChart2,
  TrendingDown,
} from "lucide-react";
import { AuthenticatedProduct, PriceVerdictEnum } from "../types";

interface ProductCardProps {
  product: AuthenticatedProduct;
  isSavedInWatchlist: boolean;
  onToggleWatchlist: (product: AuthenticatedProduct) => void;
  onInspectEvidence: (product: AuthenticatedProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSavedInWatchlist,
  onToggleWatchlist,
  onInspectEvidence,
}) => {
  const isAuthentic = product.price_verdict === PriceVerdictEnum.AUTHENTIC_DEAL;
  const isManipulated = product.price_verdict === PriceVerdictEnum.POTENTIAL_PRICE_MANIPULATION;
  const isNotDeal = product.price_verdict === PriceVerdictEnum.NOT_A_DEAL;
  const isSparse = product.price_verdict === PriceVerdictEnum.INSUFFICIENT_EVIDENCE;

  const vibePercent = Math.round(product.vibe_score * 100);

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

  const sourceLabel = isAjio
    ? "Source: AJIO"
    : isTrends
    ? "Source: Trends"
    : product.retailer_display
    ? product.retailer_display.replace(/^Catalog source:\s*/i, "Source: ")
    : `Source: ${product.retailer || product.vendor || "Catalog"}`;

  return (
    <div
      id={`product-card-${product.product_id}`}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isAuthentic
          ? "border-emerald-300 shadow-sm hover:shadow-md hover:border-emerald-500 ring-1 ring-emerald-100"
          : isManipulated
          ? "border-amber-300 shadow-sm hover:shadow-md hover:border-amber-500 bg-amber-50/10"
          : "border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300"
      }`}
    >
      <div>
        {/* Top Image Section with Overlays */}
        <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Graceful fallback to styled placeholder
                (e.currentTarget as HTMLElement).style.display = "none";
                const fallback = e.currentTarget.parentElement?.querySelector(".fallback-placeholder");
                if (fallback) (fallback as HTMLElement).style.display = "flex";
              }}
            />
          ) : null}

          {/* Graceful Placeholder if image unavailable */}
          <div
            className={`fallback-placeholder absolute inset-0 ${
              product.image_url ? "hidden" : "flex"
            } flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-stone-100 to-stone-200`}
          >
            <Sparkles className="w-8 h-8 text-stone-400 mb-2" />
            <span className="font-serif font-semibold text-stone-700 text-sm">
              {product.category.toUpperCase()}
            </span>
            <span className="text-xs text-stone-500 mt-1 line-clamp-2">
              {product.title}
            </span>
          </div>

          {/* Top-Left: Vibe Match Pill */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur shadow-sm text-stone-900 border border-stone-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Vibe Match: {vibePercent}%</span>
            </div>
          </div>

          {/* Top-Right: Watchlist Heart Button */}
          <button
            id={`watchlist-toggle-${product.product_id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(product);
            }}
            aria-label={isSavedInWatchlist ? "Remove from watchlist" : "Save to watchlist"}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur text-stone-700 hover:text-rose-500 shadow-sm transition-transform active:scale-90"
          >
            <Heart
              className={`w-4 h-4 ${
                isSavedInWatchlist ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </button>

          {/* Bottom-Left: Vendor & Retailer badge */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1 items-start">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-900/80 text-white backdrop-blur">
              {isAjio ? "AJIO" : isTrends ? "Trends" : (product.retailer || product.vendor)}
            </span>
            {product.is_mock_offer ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/90 text-stone-900 backdrop-blur shadow-sm border border-amber-300">
                Dev Mock Offer (Simulated)
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-700/80 text-white backdrop-blur shadow-sm">
                Verified Catalog Source
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          {/* Title & Category */}
          <div className="text-[11px] uppercase font-semibold tracking-wider text-stone-600 mb-1 flex items-center justify-between">
            <span>{product.category}</span>
            <span className="text-[11px] text-stone-500 font-normal">{sourceLabel}</span>
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900 line-clamp-2 leading-snug group-hover:text-amber-950 transition-colors">
            {product.title}
          </h3>

          {/* Price & Advertised Discount Block */}
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-stone-900">
              ₹{product.listed_price.toLocaleString()}
            </span>
            {product.advertised_mrp && product.advertised_mrp > product.listed_price && (
              <>
                <span className="text-xs text-stone-600 line-through">
                  ₹{product.advertised_mrp.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded">
                  {product.advertised_discount_percent}% OFF
                </span>
              </>
            )}
          </div>

          {/* Multiple Retailer Offers Section */}
          {product.alternative_offers && product.alternative_offers.length > 0 && (
            <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
                <span>Other Retailer Offers ({product.alternative_offers.length})</span>
                <span className="text-[10px] text-stone-500">Separated History</span>
              </div>
              <div className="space-y-1.5">
                {product.alternative_offers.map((offer) => (
                  <div
                    key={offer.offer_id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white border border-stone-200/60"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-medium text-stone-800">{offer.retailer_name}</span>
                      {offer.is_mock_data && (
                        <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Mock
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-stone-900">₹{offer.listed_price.toLocaleString()}</span>
                      <a
                        href={offer.product_url || "#"}
                        target={offer.product_url?.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="text-stone-600 hover:text-stone-900 p-0.5"
                        title={`View on ${offer.retailer_name}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Style Features Breakdown (Session 4 Stylist Advisor) */}
          <div className="mt-4 pt-3 border-t border-stone-100">
            <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Style Compatibility</span>
              <span className="font-normal text-stone-600 lowercase">{product.matched_features.length} matched</span>
            </div>
            <div className="space-y-1">
              {product.matched_features.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-stone-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
              {product.missing_features.slice(0, 1).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-stone-600 italic">
                  <HelpCircle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PRICE AUTHENTICITY VERDICT BANNER (VibeCart's Core Differentiator) */}
          <div className="mt-4 pt-3 border-t border-stone-100">
            <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
              Price Authenticity Check
            </div>

            {isAuthentic && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Historically Supported Deal</span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-800 leading-normal">
                  Genuine <strong>{product.actual_savings_percent}%</strong> saving below the 30-day historical median of ₹
                  {product.historical_median_price?.toLocaleString()}.
                </p>
              </div>
            )}

            {isManipulated && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Advertised Discount Not Supported</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-900 leading-normal">
                  Advertised as {product.advertised_discount_percent}% off, but current price is higher than historical median.
                </p>
              </div>
            )}

            {isNotDeal && (
              <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-stone-700">
                  <XCircle className="w-4 h-4 text-stone-500 shrink-0" />
                  <span>Standard Historical Price</span>
                </div>
                <p className="mt-1 text-[11px] text-stone-600 leading-normal">
                  Current price matches normal median (₹{product.historical_median_price?.toLocaleString()}). Not a special discount.
                </p>
              </div>
            )}

            {isSparse && (
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Insufficient Evidence</span>
                </div>
                <p className="mt-1 text-[11px] text-blue-800 leading-normal">
                  Too few historical observations to confirm discount legitimacy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 sm:p-5 pt-0 space-y-2">
        {outboundUrl ? (
          <a
            id={`view-on-retailer-btn-${product.product_id}`}
            href={outboundUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <span>{isAjio ? "View on AJIO ↗" : "View on Trends ↗"}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <div
            id={`no-purchase-link-btn-${product.product_id}`}
            className="w-full py-2.5 px-3 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium flex items-center justify-center gap-1.5 border border-stone-200 select-none cursor-default"
          >
            <span>No purchase link available</span>
          </div>
        )}

        <button
          id={`inspect-evidence-btn-${product.product_id}`}
          type="button"
          onClick={() => onInspectEvidence(product)}
          className="w-full py-2 px-3 rounded-xl border border-stone-300 hover:border-stone-800 text-stone-700 hover:bg-stone-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Inspect Historical Evidence &amp; Style</span>
        </button>
      </div>
    </div>
  );
};
