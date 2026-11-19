import { RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";
import { Select } from "../ui/Form";
import {
  DISTRICTS,
  HAZARD_FILTERS,
  SEVERITIES,
  STATUSES,
} from "../../utils/constants";

export interface ReportFilterState {
  hazard_type: string;
  severity: string;
  status: string;
  district: string;
}

export const EMPTY_REPORT_FILTERS: ReportFilterState = {
  hazard_type: "",
  severity: "",
  status: "",
  district: "",
};

export function ReportFilters({
  value,
  onChange,
  onReset,
}: {
  value: ReportFilterState;
  onChange: (next: ReportFilterState) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
        label="Status"
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
      <Select
        label="District"
        value={value.district}
        onChange={(event) => onChange({ ...value, district: event.target.value })}
      >
        <option value="">All districts</option>
        {DISTRICTS.map((district) => (
          <option key={district} value={district}>
            {district}
          </option>
        ))}
      </Select>
      <div className="flex items-end">
        <Button
          variant="outline"
          className="w-full"
          onClick={onReset}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}
