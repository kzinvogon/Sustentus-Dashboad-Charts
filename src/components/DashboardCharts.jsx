import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * Modified dashboard with dropdown selectors for x-axis values:
 * - X-axis options: Industry, Region, Product, Expert, CSAT
 * - Y-axis: Number of projects
 * - Dropdown selectors underneath the chart
 * - Emulated database fetches when x-axis changes
 */

export default function DashboardCharts() {
  const [stage, setStage] = React.useState("Active"); // Active | Closed | Proposal
  const [granularity, setGranularity] = React.useState("month"); // month | quarter | year
  const [selected, setSelected] = React.useState(null); // { xAxisValue, yAxisValue }
  const [xAxisType, setXAxisType] = React.useState("Industry"); // Industry | Region | Product | Expert | CSAT
  const [isLoading, setIsLoading] = React.useState(false);

  const REGION_COLORS = {
    EMEA: "#2563eb", // blue
    APAC: "#f59e0b", // orange
    NA: "#ef4444",   // red
    LATAM: "#a855f7" // purple
  };

  const INDUSTRIES = ["Retail", "Manufacturing", "Accountants"];
  const REGIONS = Object.keys(REGION_COLORS);
  const PRODUCTS = ["Core", "Sync", "Analytics", "AI"];
  const EXPERTS = ["Ann", "Ben", "Chao", "Dee", "Evan"];
  const CSAT_VALUES = ["😀", "🙂", "😐", "🙁"];

  const timeWindowMonths = granularity === "month" ? 3 : granularity === "quarter" ? 9 : 12;

  // Mock records
  const [records] = React.useState(() => createMockData({
    industries: INDUSTRIES,
    regions: REGIONS,
    products: PRODUCTS,
    experts: EXPERTS,
    csatValues: CSAT_VALUES,
    monthsBack: timeWindowMonths,
  }));

  const cutoff = addMonths(new Date(), -timeWindowMonths);
  const filtered = React.useMemo(
    () => records.filter(r => r.stage === stage && new Date(r.date) >= cutoff),
    [records, stage, cutoff]
  );

  // Get available values for the selected x-axis type
  const getXAxisValues = () => {
    switch (xAxisType) {
      case "Industry":
        return INDUSTRIES;
      case "Region":
        return REGIONS;
      case "Product":
        return PRODUCTS;
      case "Expert":
        return EXPERTS;
      case "CSAT":
        return CSAT_VALUES;
      default:
        return INDUSTRIES;
    }
  };

  // Get color for a specific value based on x-axis type
  const getValueColor = (value) => {
    if (xAxisType === "Region") {
      return REGION_COLORS[value] || "#6b7280";
    }
    // Generate consistent colors for other x-axis types
    const colors = ["#2563eb", "#f59e0b", "#ef4444", "#a855f7", "#10b981", "#f97316", "#8b5cf6", "#ec4899"];
    const index = getXAxisValues().indexOf(value);
    return colors[index % colors.length];
  };

  // Emulate database fetch when x-axis type changes
  const handleXAxisChange = async (newXAxisType) => {
    setIsLoading(true);
    setXAxisType(newXAxisType);
    setSelected(null); // Clear selection when x-axis changes
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const chartData = React.useMemo(() => {
    const xAxisValues = getXAxisValues();
    return xAxisValues.map(value => {
      const row = { [xAxisType]: value };
      // Create stacked bars by region for each x-axis value
      REGIONS.forEach(reg => {
        row[reg] = filtered.filter(r => {
          switch (xAxisType) {
            case "Industry":
              return r.industry === value && r.region === reg;
            case "Region":
              return r.region === value && r.region === reg;
            case "Product":
              return r.product === value && r.region === reg;
            case "Expert":
              return r.expert === value && r.region === reg;
            case "CSAT":
              return r.csat === value && r.region === reg;
            default:
              return false;
          }
        }).length;
      });
      return row;
    });
  }, [filtered, xAxisType]);

  const tableRows = React.useMemo(() => {
    if (!selected) return [];
    return filtered.filter(r => {
      const matchesXAxis = (() => {
        switch (xAxisType) {
          case "Industry":
            return r.industry === selected.xAxisValue;
          case "Region":
            return r.region === selected.xAxisValue;
          case "Product":
            return r.product === selected.xAxisValue;
          case "Expert":
            return r.expert === selected.xAxisValue;
          case "CSAT":
            return r.csat === selected.xAxisValue;
          default:
            return false;
        }
      })();
      
      return matchesXAxis && r.region === selected.region;
    });
  }, [filtered, selected, xAxisType]);

  return (
    <div className="mx-auto max-w-6xl p-3 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold">Dashboard Charts</h1>

      {/* Controls */}
      <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
        <Segmented
          label="Stage"
          value={stage}
          onChange={setStage}
          options={["Closed", "Active", "Proposal"]}
        />
        <Segmented
          label="Time"
          value={granularity}
          onChange={setGranularity}
          options={[
            { label: "Month", value: "month" }, 
            { label: "Quarter", value: "quarter" },
            { label: "Year", value: "year" }
          ]}
        />
        {selected && (
          <button onClick={() => setSelected(null)} className="w-full sm:w-auto rounded-lg border px-3 py-1 text-sm hover:bg-slate-50">
            Clear selection
          </button>
        )}
      </div>

      {/* Chart */}
      <div className="mt-6 h-64 sm:h-72 w-full rounded-2xl border p-2 sm:p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={20}>
            <XAxis dataKey={xAxisType} tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} label={{ value: 'Projects', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12 } }} />
            <Tooltip content={<CustomTooltip xAxisType={xAxisType} />} cursor={{ fill: "#f1f5f9" }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {REGIONS.map((reg) => (
              <Bar
                key={reg}
                dataKey={reg}
                stackId="a"
                fill={REGION_COLORS[reg]}
                onClick={(_, idx) => {
                  const xAxisValue = chartData[idx]?.[xAxisType];
                  setSelected({ xAxisValue, region: reg });
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* X-Axis Selector Dropdowns */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium text-slate-700">X-Axis:</span>
          <select
            value={xAxisType}
            onChange={(e) => handleXAxisChange(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isLoading}
          >
            <option value="Industry">Industry</option>
            <option value="Region">Region</option>
            <option value="Product">Product</option>
            <option value="Expert">Expert</option>
            <option value="CSAT">CSAT</option>
          </select>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
              Loading...
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Click a colored stack segment (e.g. {xAxisType === "Industry" ? "Retail" : xAxisType === "Region" ? "EMEA" : xAxisType === "Product" ? "Core" : xAxisType === "Expert" ? "Ann" : "😀"} → EMEA) to reveal the underlying table below.
      </p>

      {/* Table */}
      <div className="mt-6 rounded-2xl border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b p-4 gap-2">
          <h2 className="text-lg font-semibold">Details</h2>
          <div className="text-sm text-slate-600 text-center sm:text-left">
            {selected ? (
              <>
                Showing <strong>{tableRows.length}</strong> records for{" "}
                <span className="inline-flex items-center gap-1 flex-wrap justify-center sm:justify-start">
                  <Swatch color={REGION_COLORS[selected.region]} />
                  <span>{selected.xAxisValue}</span>
                  <span>·</span>
                  <span>{selected.region}</span>
                  <span>·</span>
                  <span>{stage}</span>
                </span>
              </>
            ) : (
              <>Click a chart segment to drill into the table.</>
            )}
          </div>
        </div>
        <div className="max-h-80 overflow-auto p-2 sm:p-4">
          {selected ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-slate-600">
                    <th className="p-2 text-xs sm:text-sm">Project</th>
                    <th className="p-2 text-xs sm:text-sm">Industry</th>
                    <th className="p-2 text-xs sm:text-sm">Region</th>
                    <th className="p-2 text-xs sm:text-sm">Stage</th>
                    <th className="p-2 text-xs sm:text-sm">Date</th>
                    <th className="p-2 text-xs sm:text-sm">Product</th>
                    <th className="p-2 text-xs sm:text-sm">Expert</th>
                    <th className="p-2 text-xs sm:text-sm">CSAT</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 text-xs sm:text-sm">{r.project}</td>
                      <td className="p-2 text-xs sm:text-sm">{r.industry}</td>
                      <td className="p-2 text-xs sm:text-sm">{r.region}</td>
                      <td className="p-2 text-xs sm:text-sm">{r.stage}</td>
                      <td className="p-2 text-xs sm:text-sm">{formatDate(r.date)}</td>
                      <td className="p-2 text-xs sm:text-sm">{r.product}</td>
                      <td className="p-2 text-xs sm:text-sm">{r.expert}</td>
                      <td className="p-2 text-xs sm:text-sm">{r.csat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-2 text-sm text-slate-600">No selection yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Segmented({ label, value, onChange, options }) {
  const opts = options.map(o => (typeof o === "string" ? { label: o, value: o } : o));
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
      <span className="text-xs sm:text-xs font-medium uppercase tracking-wide text-slate-600">{label}</span>
      <div className="inline-flex overflow-hidden rounded-xl border w-full sm:w-auto">
        {opts.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-1 text-xs sm:text-sm transition-colors ${
              o.value === value ? "bg-indigo-600 font-semibold text-white" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, xAxisType }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-white p-2 text-xs shadow-sm max-w-xs">
      <div className="font-semibold text-xs">{xAxisType}: {label}</div>
      {payload.map((pl) => (
        <div key={pl.dataKey} className="flex items-center gap-2 text-xs">
          <Swatch color={pl.fill} />
          <span>
            {pl.dataKey}: <strong>{pl.value}</strong> projects
          </span>
        </div>
      ))}
    </div>
  );
}

function Swatch({ color }) {
  return <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: color }} />;
}

// Helpers & mock data
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function addMonths(date, m) { const d = new Date(date); d.setMonth(d.getMonth() + m); return d; }
function formatDate(d) { const dt = new Date(d); return dt.toISOString().slice(0,10); }

function createMockData({ industries, regions, products, experts, csatValues, monthsBack = 3 }) {
  const stages = ["Closed", "Active", "Proposal"];

  const today = new Date();
  const start = addMonths(today, -monthsBack);
  const out = [];
  let id = 1;

  for (let i = 0; i < 220; i++) {
    const date = new Date(start.getTime() + Math.random() * (today.getTime() - start.getTime()));
    out.push({
      id: id++,
      project: `PRJ-${id}`,
      industry: randChoice(industries),
      region: randChoice(regions),
      stage: randChoice(stages),
      date: date.toISOString(),
      product: randChoice(products),
      expert: randChoice(experts),
      csat: randChoice(csatValues),
    });
  }
  return out;
}
