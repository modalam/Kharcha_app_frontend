"use client";

import { formatCurrency } from "@/shared";

type TooltipPayloadItem = {
  value: number;
  payload: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  /** Read the label from this key on the data point (more robust than `label`). */
  labelKey?: string;
  /** Optionally prettify the label, e.g. "2026-06" -> "Jun 2026". */
  labelFormatter?: (value: string) => string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  labelKey,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const rawLabel = labelKey
    ? String(item.payload[labelKey] ?? "")
    : String(label ?? "");
  const displayLabel = labelFormatter ? labelFormatter(rawLabel) : rawLabel;
  const count = item.payload.count;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      {displayLabel && (
        <p className="text-xs font-medium text-muted-foreground">{displayLabel}</p>
      )}
      <p className="text-sm font-semibold text-foreground">
        {formatCurrency(item.value)}
      </p>
      {typeof count === "number" && (
        <p className="text-xs text-muted-foreground">
          {count} {count === 1 ? "transaction" : "transactions"}
        </p>
      )}
    </div>
  );
}
