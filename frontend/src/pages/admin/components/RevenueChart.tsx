import { BarChart3, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type LabelProps, type TooltipProps } from "recharts";
import { Card, CardHeader, EmptyState, TBody, TD, TH, THead, TR, Table, Tabs } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { UZ_MONTHS, formatCompact, formatNumber, formatPrice } from "@/lib/utils";
import type { MonthlyRevenue } from "@/types";

/**
 * Single series -> one hue (brand indigo-500). Validated with the dataviz palette
 * checker against both the light (#fcfcfd) and dark (#0b1121) card surfaces.
 */
const SERIES_COLOR = "#6366f1";
const CHART_HEIGHT = 280;
/** Distinct 3-letter month ticks (plain truncation makes iyun/iyul collide). */
const MONTH_TICKS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"] as const;

type View = "chart" | "table";

const VIEW_TABS: { value: View; label: string; icon: JSX.Element }[] = [
  { value: "chart", label: "Grafik", icon: <BarChart3 className="h-4 w-4" aria-hidden="true" /> },
  { value: "table", label: "Jadval", icon: <Table2 className="h-4 w-4" aria-hidden="true" /> },
];

interface Point extends MonthlyRevenue {
  /** Short axis label, e.g. "apr" */
  tick: string;
  /** Full label, e.g. "aprel 2026" */
  label: string;
}

function toPoints(rows: MonthlyRevenue[]): Point[] {
  return rows.map((row) => {
    const monthIndex = Number(row.month.slice(5, 7)) - 1;
    const year = row.month.slice(0, 4);
    return {
      ...row,
      tick: MONTH_TICKS[monthIndex] ?? row.month,
      label: `${UZ_MONTHS[monthIndex] ?? row.month} ${year}`,
    };
  });
}

function RevenueTooltip({ active, payload }: TooltipProps<number, string>) {
  const point = payload?.[0]?.payload as Point | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-medium text-slate-900 dark:text-slate-100">{point.label}</p>
      <p className="mt-1 flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SERIES_COLOR }} aria-hidden="true" />
        {formatPrice(point.revenue, "0 so'm")}
      </p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{point.payments_count} ta to'lov</p>
    </div>
  );
}

export interface RevenueChartProps {
  data: MonthlyRevenue[];
}

/** Monthly revenue column chart (last 6 months) with a table-view twin. */
export function RevenueChart({ data }: RevenueChartProps) {
  const { isDark } = useTheme();
  const [view, setView] = useState<View>("chart");
  const points = useMemo(() => toPoints(data), [data]);
  const total = useMemo(() => points.reduce((sum, point) => sum + point.revenue, 0), [points]);
  const maxIndex = useMemo(() => {
    let best = -1;
    points.forEach((point, index) => {
      if (point.revenue > 0 && (best === -1 || point.revenue > points[best]!.revenue)) best = index;
    });
    return best;
  }, [points]);

  const ink = isDark ? "#94a3b8" : "#64748b";
  const labelInk = isDark ? "#e2e8f0" : "#334155";
  const surface = isDark ? "#0f172a" : "#ffffff";
  const grid = isDark ? "#1e293b" : "#e2e8f0";
  const cursor = isDark ? "rgba(99, 102, 241, 0.14)" : "rgba(99, 102, 241, 0.08)";

  /* Direct label on the peak month only; the axis and tooltip carry the rest. */
  const renderPeakLabel = ({ x, y, width, value, index }: LabelProps) => {
    if (index !== maxIndex || typeof value !== "number") return null;
    const cx = Number(x) + Number(width) / 2;
    return (
      <text
        x={cx}
        y={Number(y) - 8}
        textAnchor="middle"
        fill={labelInk}
        stroke={surface}
        strokeWidth={4}
        paintOrder="stroke"
        fontSize={12}
        fontWeight={500}
      >
        {formatCompact(value)}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Oylik daromad"
        description={`Oxirgi 6 oy · jami ${formatPrice(total, "0 so'm")}`}
        actions={<Tabs variant="pills" label="Ko'rinish" tabs={VIEW_TABS} value={view} onChange={setView} />}
      />
      {total === 0 ? (
        <EmptyState
          size="sm"
          icon={<BarChart3 className="h-7 w-7" aria-hidden="true" />}
          title="Hali daromad yo'q"
          description="To'langan to'lovlar paydo bo'lishi bilan grafik shu yerda chiziladi."
        />
      ) : view === "chart" ? (
        <div style={{ height: CHART_HEIGHT }} role="img" aria-label="Oxirgi 6 oylik daromad ustunli diagrammasi">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 24, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid vertical={false} stroke={grid} strokeWidth={1} />
              <XAxis dataKey="tick" tickLine={false} axisLine={{ stroke: grid }} tick={{ fill: ink, fontSize: 12 }} interval={0} dy={6} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fill: ink, fontSize: 12 }}
                tickFormatter={(value: number) => formatCompact(value)}
              />
              <Tooltip cursor={{ fill: cursor }} content={<RevenueTooltip />} />
              <Bar dataKey="revenue" fill={SERIES_COLOR} maxBarSize={24} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="revenue" content={renderPeakLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <Table className="min-w-0">
            <THead>
              <TR>
                <TH>Oy</TH>
                <TH align="right">To'lovlar</TH>
                <TH align="right">Daromad</TH>
              </TR>
            </THead>
            <TBody>
              {points.map((point) => (
                <TR key={point.month}>
                  <TD className="capitalize">{point.label}</TD>
                  <TD align="right" className="tabular-nums">
                    {formatNumber(point.payments_count)}
                  </TD>
                  <TD align="right" className="whitespace-nowrap font-medium tabular-nums text-slate-900 dark:text-slate-100">
                    {formatPrice(point.revenue, "0 so'm")}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
