/**
 * @fileoverview This file provides a suite of components for creating charts
 * using the `recharts` library. It focuses on enabling theming, custom tooltips,
 * and custom legends through a `ChartConfig` object.
 *
 * The components are designed to work together: `ChartContainer` wraps `recharts`
 * primitives and provides a `ChartContext` (consumed by `useChart`) which makes
 * the `ChartConfig` available to `ChartTooltipContent` and `ChartLegendContent`.
 * `ChartStyle` dynamically generates CSS variables for theming based on the config.
 *
 * This system allows for consistent styling and behavior of charts across the application,
 * adapting to different themes (e.g., light/dark) and providing a structured way to
 * define chart series' appearance and metadata. It appears to be a standard setup for
 * integrating a charting library with custom theming, potentially inspired by or adapted
 * from UI systems like ShadCN/ui.
 *
 * Key exported components:
 * - `ChartContainer`: The main wrapper for chart elements.
 * - `ChartTooltipContent`: Custom content renderer for chart tooltips.
 * - `ChartLegendContent`: Custom content renderer for chart legends.
 * - `ChartTooltip`, `ChartLegend`: Re-exported from `recharts`.
 *
 * The `ChartConfig` type is crucial for users of these components to define
 * how different data series in their charts should be displayed.
 */
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

/**
 * Configuration object for chart series.
 * Each key represents a data series key (e.g., 'desktop', 'mobile').
 * The value for each key defines its appearance and metadata.
 *
 * @example
 * const chartConfig = {
 *   desktop: {
 *     label: "Desktop",
 *     color: "hsl(var(--chart-1))", // Can be direct color
 *     icon: ComputerIcon,
 *   },
 *   mobile: {
 *     label: "Mobile",
 *     theme: { // Or theme-based colors
 *       light: "hsl(var(--chart-2-light))",
 *       dark: "hsl(var(--chart-2-dark))",
 *     },
 *     icon: SmartphoneIcon,
 *   },
 *   // ... other series
 * } satisfies ChartConfig;
 */
export type ChartConfig = {
  [k in string]: {
    /** Optional display label for the series (e.g., in legends, tooltips). */
    label?: React.ReactNode
    /** Optional React component type to use as an icon for the series. */
    icon?: React.ComponentType
  } & (
    | {
        /** Direct CSS color string (e.g., hex, hsl, rgb) for the series. Use this OR `theme`. */
        color?: string;
        theme?: never
      }
    | {
        color?: never;
        /**
         * An object defining theme-specific colors. Keys should match `THEMES` (e.g., 'light', 'dark').
         * Values are CSS color strings for that theme.
         */
        theme: Record<keyof typeof THEMES, string>
      }
  )
}

/**
 * Internal context properties for the chart.
 * Provides the `ChartConfig` to descendant chart components.
 * @internal
 */
type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

/**
 * Hook to access the chart configuration (`ChartConfig`) from within
 * components nested under a `ChartContainer`.
 * Throws an error if used outside of a `ChartContainer`.
 * @returns {ChartContextProps} The chart context, containing the `config`.
 */
function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

/**
 * The main wrapper component for charts.
 * It establishes a `ChartContext` to provide the `config` to all child components,
 * dynamically generates CSS variables for theming via `ChartStyle`, and uses
 * `RechartsPrimitive.ResponsiveContainer` to make the chart responsive.
 *
 * @param {object} props - Component props.
 * @param {string} [props.id] - Optional ID for the chart; a unique one is generated if not provided.
 * @param {string} [props.className] - Additional CSS classes for the container div.
 * @param {ChartConfig} props.config - The chart configuration object defining series styles and metadata.
 * @param {React.ReactNode} props.children - The chart content, typically `recharts` components
 *                                         (e.g., `<BarChart>`, `<LineChart>`).
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the underlying div element.
 * @returns {React.JSX.Element} The chart container with context and styles applied.
 */
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

/**
 * Internal component that dynamically generates CSS variables for chart colors
 * based on the provided `ChartConfig` and defined `THEMES`.
 * These CSS variables (e.g., `--color-desktop`, `--color-mobile`) can then be used
 * in `recharts` components to style individual series.
 * @param {object} props - Component props.
 * @param {string} props.id - The unique ID of the chart (prefixed with `chart-`).
 * @param {ChartConfig} props.config - The chart configuration object.
 * @returns {React.JSX.Element | null} A style element with generated CSS variables, or null if no color config.
 * @internal
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

/** Re-export of `RechartsPrimitive.Tooltip` for direct use if needed. */
const ChartTooltip = RechartsPrimitive.Tooltip

/**
 * A custom content renderer for `RechartsPrimitive.Tooltip`.
 * It uses the `ChartConfig` (via `useChart` hook) to display labels, icons,
 * and color indicators for the data series in the tooltip.
 *
 * @param {object} props - Component props, extending Recharts Tooltip props and div props.
 * @param {boolean} [props.active] - Passed by Recharts, true if the tooltip is active.
 * @param {Array<object>} [props.payload] - Passed by Recharts, data for the items in the tooltip.
 * @param {string} [props.className] - Additional CSS classes for the tooltip container.
 * @param {'line' | 'dot' | 'dashed'} [props.indicator='dot'] - Style of the color indicator for each series.
 * @param {boolean} [props.hideLabel=false] - If true, hides the main tooltip label.
 * @param {boolean} [props.hideIndicator=false] - If true, hides the color indicators for series.
 * @param {React.ReactNode} [props.label] - Passed by Recharts, the label for the current tooltip point.
 * @param {function} [props.labelFormatter] - Custom formatter function for the main tooltip label.
 * @param {string} [props.labelClassName] - CSS classes for the main tooltip label.
 * @param {function} [props.formatter] - Custom formatter function for individual series items in the tooltip.
 * @param {string} [props.color] - Fallback color for indicators if not found in config.
 * @param {string} [props.nameKey] - Key to use from payload item to find series name/config.
 * @param {string} [props.labelKey] - Key to use from payload item for the main tooltip label value.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the underlying div element.
 * @returns {React.JSX.Element | null} The rendered tooltip content, or null if not active or no payload.
 */
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip" // Should be ChartTooltipContent.displayName

/** Re-export of `RechartsPrimitive.Legend` for direct use if needed. */
const ChartLegend = RechartsPrimitive.Legend

/**
 * A custom content renderer for `RechartsPrimitive.Legend`.
 * It uses the `ChartConfig` (via `useChart` hook) to display labels and icons
 * for each legend item, allowing for a themed legend that matches the chart series.
 *
 * @param {object} props - Component props, extending div props and picking some from Recharts LegendProps.
 * @param {string} [props.className] - Additional CSS classes for the legend container.
 * @param {boolean} [props.hideIcon=false] - If true, hides the color indicator/icon for legend items.
 * @param {Array<object>} [props.payload] - Passed by Recharts, data for the legend items.
 * @param {'top' | 'bottom' | 'middle'} [props.verticalAlign='bottom'] - Vertical alignment of the legend.
 * @param {string} [props.nameKey] - Key to use from payload item to find series name/config.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the underlying div element.
 * @returns {React.JSX.Element | null} The rendered legend content, or null if no payload.
 */
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend" // Should be ChartLegendContent.displayName

/**
 * Helper function to extract the specific item configuration from the main `ChartConfig`
 * based on the data payload of a Recharts item (e.g., from a tooltip or legend).
 * It tries to find a matching configuration using the item's `dataKey`, `name`, or a
 * provided `key`.
 *
 * @param {ChartConfig} config - The main chart configuration object.
 * @param {unknown} payload - The payload item from Recharts (e.g., tooltip payload item).
 * @param {string} key - The primary key to look for in the payload or config.
 * @returns {object | undefined} The item's specific configuration from `ChartConfig`, or undefined if not found.
 */
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
