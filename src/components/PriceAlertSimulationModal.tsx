import React, { useState } from "react";
import { X, Radio, Send, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import { PriceUpdateResult } from "../types";

interface PriceAlertSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPriceUpdated?: () => void;
}

export const PriceAlertSimulationModal: React.FC<PriceAlertSimulationModalProps> = ({
  isOpen,
  onClose,
  onPriceUpdated,
}) => {
  if (!isOpen) return null;

  const [productId, setProductId] = useState("VB-DRESS-002");
  const [vendor, setVendor] = useState("FastChic Trends");
  const [newPrice, setNewPrice] = useState("1699");
  const [advertisedMrp, setAdvertisedMrp] = useState("4999");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PriceUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.simulatePriceUpdate({
        event_id: `evt-${Date.now().toString(36)}`,
        product_id: productId,
        vendor: vendor,
        new_price: parseFloat(newPrice),
        advertised_mrp: advertisedMrp ? parseFloat(advertisedMrp) : undefined,
      });
      setResult(res);
      if (onPriceUpdated) onPriceUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to simulate price update event.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="price-simulator-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="price-simulator-modal-card"
        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-amber-700 mb-2">
          <Radio className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-bold">
            Patchamomma Session 5 Demo Tool
          </span>
        </div>

        <h3 className="font-serif font-bold text-xl text-stone-900">
          Pub/Sub Price Event Simulator
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Dispatches a mock Google Cloud Pub/Sub price change payload to{" "}
          <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">
            POST /api/v1/events/price-update
          </code>
          . Watch how the deterministic verification engine recalculates the verdict!
        </p>

        <form onSubmit={handleSimulate} className="mt-5 space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Select Product:
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:border-stone-800"
            >
              <option value="VB-DRESS-002">
                VB-DRESS-002 (FastChic Georgette Dress - currently flagged as fake discount)
              </option>
              <option value="VB-DRESS-001">
                VB-DRESS-001 (Anaya Couture Summer Cotton Dress - Authentic Deal)
              </option>
              <option value="VB-DRESS-003">
                VB-DRESS-003 (Kala Mandir Handblock Midi - Standard Price)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                New Price (₹):
              </label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:border-stone-800 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Advertised MRP (₹):
              </label>
              <input
                type="number"
                value={advertisedMrp}
                onChange={(e) => setAdvertisedMrp(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:border-stone-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-stone-900 text-white hover:bg-stone-800 font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            {isSubmitting ? (
              <span>Dispatching Event...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Vendor Price Drop Event</span>
              </>
            )}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Result outcome */}
        {result && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pub/Sub Event Ingestion Succeeded</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                Previous Price: <strong>₹{result.previous_price}</strong>
              </div>
              <div>
                New Price: <strong>₹{result.new_price}</strong>
              </div>
              <div>
                Updated Verdict: <strong>{result.verdict}</strong>
              </div>
              <div>
                Alert Triggered: <strong>{result.alert_triggered ? "YES (Authentic Deal)" : "NO"}</strong>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800 mt-1 italic border-t border-emerald-200 pt-1.5">
              {result.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
