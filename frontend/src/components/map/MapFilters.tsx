import { RotateCcw } from "lucide-react";
import { Select } from "../ui/Form";
import { Button } from "../ui/Button";
import {
  HAZARD_FILTERS,
  SEVERITIES,
  STATUSES,
} from "../../utils/constants";

export interface MapFilterState {
  hazard_type: string;
  severity: string;
  status: string;
}

export function MapFilters({
  value,
  onChange,
  onReset,
  resultCount,
}: {
  value: MapFilterState;
  onChange: (next: MapFilterState) => void;
  onReset: () => void;
  resultCount: number;
}) {
  return (
    <div className="rw-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Hazard type"
          value={value.hazard_type}
          onChange={(event) =>
            onChange({ ...value, hazard_type: event.target.value })
          }
        >
          <option value="">All categories</option>
          {HAZARD_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          label="Severity"
          value={value.severity}
          onChange={(event) => onChange({ ...value, severity: event.target.value })}
        >
          <option value="">All severities</option>
          {SEVERITIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          label="Verification"
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value })}
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </Select>
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReset}
            icon={<RotateCcw className="h-4 w-4" />}
          >
            Reset
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Showing <span className="font-semibold text-ink">{resultCount}</span>{" "}
        report{resultCount === 1 ? "" : "s"} in the current viewport and filter
        set.
      </p>
    </div>
  );
}
