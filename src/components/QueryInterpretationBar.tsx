import React from "react";
import { Sparkles, Tag, DollarSign, Layers, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { ProductQuerySpec, RetailerSourceStatus, AdapterStatusEnum } from "../types";

interface QueryInterpretationBarProps {
  spec: ProductQuerySpec;
  resultsCount: number;
  totalExamined: number;
  sourceStatuses?: RetailerSourceStatus[];
  onClearQuery: () => void;
}

export const QueryInterpretationBar: React.FC<QueryInterpretationBarProps> = ({
  spec,
  resultsCount,
  totalExamined,
  sourceStatuses,
  onClearQuery,
}) => {
  return (
    <div
      id="query-interpretation-bar"
      className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm mb-6 space-y-3"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Parsed Search Understanding
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* Category Tag */}
              {spec.category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200">
                  <Layers className="w-3 h-3 text-stone-500" />
                  Category: <strong className="capitalize">{spec.category}</strong>
                </span>
              )}

              {/* Budget Tag */}
              {spec.max_budget ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  Max Budget: <strong>₹{spec.max_budget.toLocaleString()}</strong>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-600 border border-stone-200">
                  Budget: Unconstrained
                </span>
              )}

              {/* Style Requirements */}
              {(spec.explicit_features.length > 0
                ? spec.explicit_features
                : spec.style_keywords
              ).map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50/80 text-amber-900 border border-amber-200/80"
                >
                  <Tag className="w-3 h-3 text-amber-700" />
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
          <div className="text-xs text-stone-500">
            Showing <strong className="text-stone-900">{resultsCount}</strong> curated of{" "}
            <strong className="text-stone-900">{totalExamined}</strong> catalog candidates
          </div>
          <button
            onClick={onClearQuery}
            className="text-xs font-medium text-stone-500 hover:text-stone-800 underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Retailer Source Status Indicators */}
      {sourceStatuses && sourceStatuses.length > 0 && (
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">Aggregator Sources:</span>
          {sourceStatuses.map((source) => {
            const isSuccess = source.status === AdapterStatusEnum.SUCCESS;
            const isNotConfigured = source.status === AdapterStatusEnum.NOT_CONFIGURED;
            const isTimeout = source.status === AdapterStatusEnum.TIMEOUT;

            return (
              <span
                key={source.retailer_id}
                title={source.message || ""}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                  isSuccess
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : isNotConfigured
                    ? "bg-stone-50 text-stone-500 border-stone-200"
                    : isTimeout
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : isTimeout ? (
                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-stone-400 shrink-0" />
                )}
                <span>{source.retailer_name}:</span>
                <span className="font-semibold">
                  {isSuccess
                    ? `${source.candidate_count} items (${source.latency_ms.toFixed(0)}ms)`
                    : source.status.replace("_", " ")}
                </span>
                {source.is_mock_source && !isNotConfigured && (
                  <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-900">MOCK</span>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

