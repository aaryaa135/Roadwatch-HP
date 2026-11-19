import { ScanSearch, Sparkles } from "lucide-react";
import type { AIInferenceResult } from "../../types";
import { formatConfidence } from "../../utils/format";

export function AIAnnotation({ result }: { result: AIInferenceResult }) {
  const confidence = result.confidence <= 1 ? result.confidence * 100 : result.confidence;
  const bounded = Math.max(0, Math.min(100, Math.round(confidence)));

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-4">
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink">AI visual assist</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {result.message || "The model analysed the attached photograph."}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <ScanSearch className="h-3.5 w-3.5" />
            Model confidence
          </span>
          <span className="font-semibold text-ink">
            {formatConfidence(result.confidence)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-brand-600"
            style={{ width: `${bounded}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px] text-muted">
          <span className="rounded-full border border-brand-200 bg-white px-2 py-0.5">
            {result.model_type.replace(/_/g, " ")}
          </span>
          <span className="rounded-full border border-brand-200 bg-white px-2 py-0.5">
            {result.model_loaded ? "Model loaded" : "Model not loaded"}
          </span>
          {result.predictions.length > 0 && (
            <span className="rounded-full border border-brand-200 bg-white px-2 py-0.5">
              {result.predictions.length} prediction
              {result.predictions.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 border-t border-brand-200/70 pt-2 text-[10px] leading-relaxed text-muted">
        AI confidence is a model signal only. It does not verify the report or
        determine severity — those remain human decisions.
      </p>
    </div>
  );
}
