import { SEVERITIES, STATUSES } from "../../utils/constants";

export function MapLegend() {
  return (
    <div className="rw-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
        Map legend
      </h3>
      <div className="mt-3 space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold text-ink">Severity</p>
          <div className="grid grid-cols-2 gap-2">
            {SEVERITIES.map((severity) => (
              <div key={severity.code} className="flex items-center gap-2 text-xs text-muted">
                <span
                  className="h-3 w-3 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: severity.color }}
                  aria-hidden="true"
                />
                {severity.label}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-ink">Verification</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((status) => (
              <div key={status.code} className="flex items-center gap-2 text-xs text-muted">
                <span
                  className="h-2 w-2 rounded-full bg-muted/50"
                  aria-hidden="true"
                />
                {status.label}
              </div>
            ))}
          </div>
        </div>
        <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
          Marker letters identify the hazard category. Marker colour shows
          severity. Select a marker to inspect the report.
        </p>
      </div>
    </div>
  );
}
