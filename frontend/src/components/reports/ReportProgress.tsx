import { Check } from "lucide-react";
import { cn } from "../../utils/format";

const steps = [
  { id: 1, label: "Photograph" },
  { id: 2, label: "Location" },
  { id: 3, label: "Details" },
  { id: 4, label: "Review" },
];

export function ReportProgress({
  photoDone,
  locationDone,
  detailsDone,
  reviewDone,
}: {
  photoDone: boolean;
  locationDone: boolean;
  detailsDone: boolean;
  reviewDone: boolean;
}) {
  const done = [photoDone, locationDone, detailsDone, reviewDone];
  const current = Math.max(1, done.findIndex((item) => !item) + 1);

  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {steps.map((step, index) => {
        const complete = done[index];
        const active = !complete && step.id === current;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                complete
                  ? "border-brand-700 bg-brand-700 text-white"
                  : active
                    ? "border-brand-600 bg-white text-brand-700"
                    : "border-line bg-white text-muted"
              )}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : step.id}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                complete || active ? "text-ink" : "text-muted"
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <span className="hidden h-px w-6 bg-line sm:block" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
