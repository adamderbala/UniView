"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "./utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

/* ----------------------------------------------------------------------------
 * Chart Container
 * --------------------------------------------------------------------------*/

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/* ----------------------------------------------------------------------------
 * Chart Style
 * --------------------------------------------------------------------------*/

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, cfg]) => cfg.theme || cfg.color,
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, cfg]) => {
    const color =
      cfg.theme?.[theme as keyof typeof cfg.theme] || cfg.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

/* ----------------------------------------------------------------------------
 * Tooltip
 * --------------------------------------------------------------------------*/

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  labelFormatter,
  labelClassName,
//  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<"div"> & {
  active?: boolean;
  payload?: unknown[];
  label?: unknown;

  // ⬇️ explicitly declare these
  formatter?: (
    value: unknown,
    name: unknown,
    item: unknown,
    index: number,
    payload: unknown[],
  ) => React.ReactNode;

  labelFormatter?: (
    label: unknown,
    payload: unknown[],
  ) => React.ReactNode;

  labelClassName?: string;
  color?: string;

  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
}) {

  const { config } = useChart();

  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel) return null;

    const rawItem = payload[0] as any;
    const key =
      labelKey ||
      rawItem?.dataKey ||
      rawItem?.name ||
      "value";

    const itemConfig = getPayloadConfigFromPayload(
      config,
      rawItem,
      key,
    );

    const value =
      typeof label === "string"
        ? config[label]?.label || label
        : itemConfig?.label;

    if (!value) return null;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload as any)}
        </div>
      );
    }

    return (
      <div className={cn("font-medium", labelClassName)}>
        {value}
      </div>
    );
  }, [label, payload, hideLabel, labelFormatter, labelClassName, config, labelKey]);

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {!nestLabel && tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((rawItem, index) => {
          const item = rawItem as any;
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(
            config,
            item,
            key,
          );

          const indicatorColor =
            color || item.payload?.fill || item.color;

          return (
            <div
              key={index}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2",
                indicator === "dot" && "items-center",
              )}
            >
              {!hideIndicator && (
                <div
                  className={cn("shrink-0", {
                    "h-2.5 w-2.5 rounded-sm": indicator === "dot",
                    "w-1": indicator === "line",
                    "w-0 border border-dashed": indicator === "dashed",
                  })}
                  style={{
                    backgroundColor: indicatorColor,
                    borderColor: indicatorColor,
                  }}
                />
              )}

              <div className="flex flex-1 justify-between">
                <div className="grid gap-1">
                  {nestLabel && tooltipLabel}
                  <span className="text-muted-foreground">
                    {itemConfig?.label || item.name}
                  </span>
                </div>

                {item.value != null && (
                  <span className="font-mono font-medium tabular-nums">
                    {item.value.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Legend
 * --------------------------------------------------------------------------*/

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  payload?: unknown[];
  verticalAlign?: "top" | "bottom";
  hideIcon?: boolean;
  nameKey?: string;
}) {
  const { config } = useChart();

  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload.map((rawItem, index) => {
        const item = rawItem as any;
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(
          config,
          item,
          key,
        );

        return (
          <div key={index} className="flex items-center gap-1.5">
            {!hideIcon && itemConfig?.icon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------------*/

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, any>;
  const nested =
    typeof record.payload === "object" && record.payload
      ? record.payload
      : undefined;

  let configKey = key;

  if (typeof record[key] === "string") {
    configKey = record[key];
  } else if (nested && typeof nested[key] === "string") {
    configKey = nested[key];
  }

  return config[configKey] || config[key];
}

/* ----------------------------------------------------------------------------
 * Exports
 * --------------------------------------------------------------------------*/

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
