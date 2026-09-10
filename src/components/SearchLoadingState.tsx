import React, { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface SearchLoadingStateProps {
  query: string;
}

const STEPS = [
  { id: 1, label: "Understanding your style...", duration: 600 },
  { id: 2, label: "Finding matching products...", duration: 800 },
  { id: 3, label: "Checking the deals...", duration: 900 },
  { id: 4, label: "Ranking the best matches...", duration: 700 },
];

export const SearchLoadingState: React.FC<SearchLoadingStateProps> = ({ query }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="search-loading-container"
      className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-stone-200 shadow-sm text-center"
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-800 mb-4">
        <Loader2 className="w-6 h-6 animate-spin text-stone-900" />
      </div>

      <h3 className="font-serif text-xl font-bold text-stone-900">
        Authenticating Your Style
      </h3>
      <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto line-clamp-1 italic">
        "{query}"
      </p>

      {/* Sequential Consumer-Friendly Steps */}
      <div className="mt-8 space-y-3.5 text-left max-w-xs mx-auto">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${
                isPending ? "opacity-35 text-stone-400" : "opacity-100 text-stone-800"
              }`}
            >
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-stone-300" />
                )}
              </div>
              <span className={isCurrent ? "font-semibold text-stone-900" : "font-normal"}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-stone-100 text-xs text-stone-600">
        Calculating 30-day historical medians &amp; validating design silhouettes
      </div>
    </div>
  );
};
