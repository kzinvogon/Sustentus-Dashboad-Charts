import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * Standalone demo of the sketch:
 * - Stacked bars by Industry
 * - Color by Region (EMEA, APAC, NA, LATAM)
 * - Stage toggle (Closed / Active / Proposal)
 * - Time toggle (Month / Quarter)
 * - Clicking a stack segment reveals the filtered table
 */

export default function DashboardCharts() {
  const [stage, setStage] = React.useState("Active"); // Active | Closed | Proposal
  const [granularity, setGranularity] = React.useState("month"); // month | quarter
  const [selected, setSelected] = React.useState(null); // { industry, region }

  const REGION_COLORS = {
    EMEA: "#2563eb", // blue
    APAC: "#f59e0b", // orange
    NA: "#ef4444",   // red
    LATAM: "#a855f7" // purple
  };

  const INDUSTRIES = ["Retail", "Manufacturing", "Accountants"];
  const REGIONS = Object.keys(REGION_COLORS);

  // Mock records
  const [records] = React.useState(() => createMockData({
    industries: INDUSTRIES,
    regions: REGIONS,
    monthsBack: granularity === "month" ? 3 : 9,
  }));

  const timeWindowMonths = granularity === "month" ? 3 : 9;
  const cutoff = addMonths(new Date(), -timeWindowMonths);
  const filtered = React.useMemo(
    () => records.filter(r => r.stage === stage && new Date(r.date) >= cutoff),
    [records, stage, cutoff]
  );

  const chartData = React.useMemo(() => {
    return INDUSTRIES.map(ind => {
      const row = { industry: ind };
      REGIONS.forEach(reg => {
        row[reg] = filtered.filter(r => r.industry === ind && r.region === reg).length;
      });
      return row;
    });
  }, [filtered]);

  const tableRows = React.useMemo(() => {
    if (!selected) return [];
    return filtered.filter(r => r.industry === selected.industry && r.region === selected.region);
  }, [filtered, selected]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Dashboard Charts</h1>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
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
          options={[{ label: "Month", value: "month" }, { label: "Quarter", value: "quarter" }]}
        />
        {selected && (
          <button onClick={() => setSelected(null)} className="ml-auto rounded-lg border px-3 py-1 text-sm hover:bg-slate-50">
            Clear selection
          </button>
        )}
      </div>

      {/* Chart */}
      <div className="mt-6 h-72 w-full rounded-2xl border p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={20}>
            <XAxis dataKey="industry" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {REGIONS.map((reg) => (
              <Bar
                key={reg}
                dataKey={reg}
                stackId="a"
                fill={REGION_COLORS[reg]}
                onClick={(_, idx) => {
                  const industry = chartData[idx]?.industry;
                  setSelected({ industry, region: reg });
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Click a colored stack (e.g. Retail → EMEA) to reveal the underlying table below.
      </p>

      {/* Table */}
      <div className="mt-6 rounded-2xl border">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <div className="text-sm text-slate-600">
            {selected ? (
              <>
                Showing <strong>{tableRows.length}</strong> records for{" "}
                <span className="inline-flex items-center gap-1">
                  <Swatch color={REGION_COLORS[selected.region]} />
                  <span>{selected.industry}</span>
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
        <div className="max-h-80 overflow-auto p-4">
          {selected ? (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-slate-600">
                  <th className="p-2">Project</th>
                  <th className="p-2">Industry</th>
                  <th className="p-2">Region</th>
                  <th className="p-2">Stage</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Product</th>
                  <th className="p-2">Expert</th>
                  <th className="p-2">CSAT</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.project}</td>
                    <td className="p-2">{r.industry}</td>
                    <td className="p-2">{r.region}</td>
                    <td className="p-2">{r.stage}</td>
                    <td className="p-2">{formatDate(r.date)}</td>
                    <td className="p-2">{r.product}</td>
                    <td className="p-2">{r.expert}</td>
                    <td className="p-2">{r.csat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-600">{label}</span>
      <div className="inline-flex overflow-hidden rounded-xl border">
        {opts.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1 text-sm ${
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-white p-2 text-xs shadow-sm">
      <div className="font-semibold">{label}</div>
      {payload.map((pl) => (
        <div key={pl.dataKey} className="flex items-center gap-2">
          <Swatch color={pl.fill} />
          <span>
            {pl.dataKey}: <strong>{pl.value}</strong>
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

function createMockData({ industries, regions, monthsBack = 3 }) {
  const products = ["Core", "Sync", "Analytics", "AI"];
  const experts = ["Ann", "Ben", "Chao", "Dee", "Evan"];
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
      csat: ["😀","🙂","😐","🙁"][Math.floor(Math.random()*4)],
    });
  }
  return out;
}
