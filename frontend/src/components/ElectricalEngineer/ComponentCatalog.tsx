import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// ---------------------------------------------------------------------------
// Types mirroring the Python dataclasses returned by the catalog API
// ---------------------------------------------------------------------------

interface BatterySpec {
  model_name: string;
  manufacturer: string;
  chemistry: string;
  capacity_kwh: number;
  rated_power_kw: number;
  c_rate: number;
  dc_voltage_range_v: [number, number];
  dimensions_m: [number, number, number];
  weight_kg: number;
  ip_rating: string;
  iec_standard: string;
  roundtrip_efficiency: number;
  cycle_life: number;
  dod_percent: number;
  operating_temp_range: [number, number];
  fire_suppression: string;
  container_type: string;
}

interface PCSSpec {
  model_name: string;
  manufacturer: string;
  rated_power_kw: number;
  ac_voltage_v: number;
  dc_voltage_range_v: [number, number];
  efficiency_peak: number;
  efficiency_at_10_percent: number;
  ip_rating: string;
  iec_standard: string;
  grid_forming_capable: boolean;
  reactive_power_capability_kvar: number;
  dimensions_m: [number, number, number];
  weight_kg: number;
  cooling: string;
}

interface TransformerSpec {
  model_name: string;
  rated_power_kva: number;
  primary_voltage_kv: number;
  secondary_voltage_kv: number;
  vector_group: string;
  impedance_percent: number;
  no_load_losses_kw: number;
  full_load_losses_kw: number;
  iec_standard: string;
  cooling_type: string;
  insulation_class: string;
}

// ---------------------------------------------------------------------------
// API fetchers
// ---------------------------------------------------------------------------

const API_BASE = "/api/catalog";

const fetchBatteries = (): Promise<BatterySpec[]> =>
  axios.get(`${API_BASE}/batteries`).then((r) => r.data);

const fetchPCS = (): Promise<PCSSpec[]> =>
  axios.get(`${API_BASE}/pcs`).then((r) => r.data);

const fetchTransformers = (): Promise<TransformerSpec[]> =>
  axios.get(`${API_BASE}/transformers`).then((r) => r.data);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type Tab = "batteries" | "pcs" | "transformers";

interface BadgeProps {
  label: string;
}
function Badge({ label }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#1e3a5f",
        color: "#7dd3fc",
        fontSize: 11,
        padding: "2px 6px",
        borderRadius: 4,
        marginRight: 4,
      }}
    >
      {label}
    </span>
  );
}

interface AddButtonProps {
  onClick: () => void;
}
function AddButton({ onClick }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 8,
        padding: "6px 14px",
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      + Add to Site
    </button>
  );
}

// ---------------------------------------------------------------------------
// Battery card
// ---------------------------------------------------------------------------

interface BatteryCardProps {
  spec: BatterySpec;
  onSelect: (type: string, props: Record<string, unknown>) => void;
}
function BatteryCard({ spec, onSelect }: BatteryCardProps) {
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span style={modelNameStyle}>{spec.model_name}</span>
        <span style={manufacturerStyle}>{spec.manufacturer}</span>
      </div>
      <div style={specGridStyle}>
        <SpecRow label="Chemistry" value={spec.chemistry} />
        <SpecRow label="Capacity" value={`${spec.capacity_kwh} kWh`} />
        <SpecRow label="Power" value={`${spec.rated_power_kw} kW`} />
        <SpecRow label="C-rate" value={`${spec.c_rate}C`} />
        <SpecRow
          label="DC Voltage"
          value={`${spec.dc_voltage_range_v[0]}–${spec.dc_voltage_range_v[1]} V`}
        />
        <SpecRow label="Efficiency" value={`${(spec.roundtrip_efficiency * 100).toFixed(1)} %`} />
        <SpecRow label="Cycle Life" value={`${spec.cycle_life.toLocaleString()} cycles`} />
        <SpecRow label="DoD" value={`${spec.dod_percent} %`} />
        <SpecRow
          label="Temp Range"
          value={`${spec.operating_temp_range[0]} to ${spec.operating_temp_range[1]} °C`}
        />
        <SpecRow label="IP Rating" value={spec.ip_rating} />
        <SpecRow label="Container" value={spec.container_type} />
        <SpecRow label="Fire Suppression" value={spec.fire_suppression} />
      </div>
      <div style={{ marginTop: 6 }}>
        <Badge label={spec.iec_standard} />
      </div>
      <AddButton
        onClick={() =>
          onSelect("battery_container", {
            model_name: spec.model_name,
            manufacturer: spec.manufacturer,
            capacity_kwh: spec.capacity_kwh,
            rated_power_kw: spec.rated_power_kw,
            container_type: spec.container_type,
            dimensions_m: spec.dimensions_m,
            weight_kg: spec.weight_kg,
          })
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PCS card
// ---------------------------------------------------------------------------

interface PCSCardProps {
  spec: PCSSpec;
  onSelect: (type: string, props: Record<string, unknown>) => void;
}
function PCSCard({ spec, onSelect }: PCSCardProps) {
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span style={modelNameStyle}>{spec.model_name}</span>
        <span style={manufacturerStyle}>{spec.manufacturer}</span>
      </div>
      <div style={specGridStyle}>
        <SpecRow label="Rated Power" value={`${spec.rated_power_kw} kW`} />
        <SpecRow label="AC Voltage" value={`${spec.ac_voltage_v} V`} />
        <SpecRow
          label="DC Voltage"
          value={`${spec.dc_voltage_range_v[0]}–${spec.dc_voltage_range_v[1]} V`}
        />
        <SpecRow label="Peak Efficiency" value={`${(spec.efficiency_peak * 100).toFixed(1)} %`} />
        <SpecRow
          label="Efficiency @10%"
          value={`${(spec.efficiency_at_10_percent * 100).toFixed(1)} %`}
        />
        <SpecRow label="Reactive Power" value={`${spec.reactive_power_capability_kvar} kVAR`} />
        <SpecRow label="Grid Forming" value={spec.grid_forming_capable ? "Yes" : "No"} />
        <SpecRow label="Cooling" value={spec.cooling} />
        <SpecRow label="IP Rating" value={spec.ip_rating} />
        <SpecRow label="Weight" value={`${spec.weight_kg} kg`} />
      </div>
      <div style={{ marginTop: 6 }}>
        <Badge label={spec.iec_standard} />
      </div>
      <AddButton
        onClick={() =>
          onSelect("pcs", {
            model_name: spec.model_name,
            manufacturer: spec.manufacturer,
            rated_power_kw: spec.rated_power_kw,
            ac_voltage_v: spec.ac_voltage_v,
            dimensions_m: spec.dimensions_m,
          })
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transformer card
// ---------------------------------------------------------------------------

interface TransformerCardProps {
  spec: TransformerSpec;
  onSelect: (type: string, props: Record<string, unknown>) => void;
}
function TransformerCard({ spec, onSelect }: TransformerCardProps) {
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span style={modelNameStyle}>{spec.model_name}</span>
      </div>
      <div style={specGridStyle}>
        <SpecRow label="Rating" value={`${spec.rated_power_kva} kVA`} />
        <SpecRow
          label="Ratio"
          value={`${spec.primary_voltage_kv} kV / ${spec.secondary_voltage_kv} kV`}
        />
        <SpecRow label="Vector Group" value={spec.vector_group} />
        <SpecRow label="Impedance" value={`${spec.impedance_percent} %`} />
        <SpecRow label="No-Load Losses" value={`${spec.no_load_losses_kw} kW`} />
        <SpecRow label="Full-Load Losses" value={`${spec.full_load_losses_kw} kW`} />
        <SpecRow label="Cooling" value={spec.cooling_type} />
        <SpecRow label="Insulation Class" value={spec.insulation_class} />
      </div>
      <div style={{ marginTop: 6 }}>
        <Badge label={spec.iec_standard} />
      </div>
      <AddButton
        onClick={() =>
          onSelect("transformer", {
            model_name: spec.model_name,
            rated_power_kva: spec.rated_power_kva,
            primary_voltage_kv: spec.primary_voltage_kv,
            secondary_voltage_kv: spec.secondary_voltage_kv,
            vector_group: spec.vector_group,
          })
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared spec row
// ---------------------------------------------------------------------------

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

interface FilterBarProps {
  manufacturers: string[];
  selected: string;
  onSelect: (m: string) => void;
}
function FilterBar({ manufacturers, selected, onSelect }: FilterBarProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
      <button
        onClick={() => onSelect("")}
        style={filterBtnStyle(selected === "")}
      >
        All
      </button>
      {manufacturers.map((m) => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          style={filterBtnStyle(selected === m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface ComponentCatalogProps {
  onSelectComponent: (componentType: string, properties: Record<string, unknown>) => void;
  onClose: () => void;
}

export function ComponentCatalog({ onSelectComponent, onClose }: ComponentCatalogProps) {
  const [activeTab, setActiveTab] = useState<Tab>("batteries");
  const [manufacturerFilter, setManufacturerFilter] = useState("");

  const { data: batteries = [], isLoading: loadingBat } = useQuery({
    queryKey: ["catalog", "batteries"],
    queryFn: fetchBatteries,
  });

  const { data: pcsList = [], isLoading: loadingPCS } = useQuery({
    queryKey: ["catalog", "pcs"],
    queryFn: fetchPCS,
  });

  const { data: transformers = [], isLoading: loadingTx } = useQuery({
    queryKey: ["catalog", "transformers"],
    queryFn: fetchTransformers,
  });

  const isLoading = loadingBat || loadingPCS || loadingTx;

  // Derive manufacturer list for current tab
  const manufacturers: string[] = Array.from(
    new Set(
      activeTab === "batteries"
        ? batteries.map((b) => b.manufacturer)
        : activeTab === "pcs"
        ? pcsList.map((p) => p.manufacturer)
        : [] // transformers don't have a manufacturer field
    )
  ).sort();

  const filteredBatteries = manufacturerFilter
    ? batteries.filter((b) => b.manufacturer === manufacturerFilter)
    : batteries;

  const filteredPCS = manufacturerFilter
    ? pcsList.filter((p) => p.manufacturer === manufacturerFilter)
    : pcsList;

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>
          BESS Component Catalog
        </span>
        <button onClick={onClose} style={closeBtnStyle}>
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        {(["batteries", "pcs", "transformers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t);
              setManufacturerFilter("");
            }}
            style={tabStyle(activeTab === t)}
          >
            {t === "batteries" ? "Batteries" : t === "pcs" ? "PCS / Inverters" : "Transformers"}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      {(activeTab === "batteries" || activeTab === "pcs") && manufacturers.length > 0 && (
        <FilterBar
          manufacturers={manufacturers}
          selected={manufacturerFilter}
          onSelect={setManufacturerFilter}
        />
      )}

      {/* Content */}
      <div style={scrollAreaStyle}>
        {isLoading && (
          <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 32 }}>
            Loading catalog...
          </p>
        )}

        {!isLoading && activeTab === "batteries" &&
          filteredBatteries.map((b) => (
            <BatteryCard key={b.model_name} spec={b} onSelect={onSelectComponent} />
          ))}

        {!isLoading && activeTab === "pcs" &&
          filteredPCS.map((p) => (
            <PCSCard key={p.model_name} spec={p} onSelect={onSelectComponent} />
          ))}

        {!isLoading && activeTab === "transformers" &&
          transformers.map((t) => (
            <TransformerCard key={t.model_name} spec={t} onSelect={onSelectComponent} />
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  width: 380,
  height: "100%",
  background: "#0f172a",
  borderLeft: "1px solid #1e293b",
  display: "flex",
  flexDirection: "column",
  fontFamily: "Inter, system-ui, sans-serif",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 16px",
  borderBottom: "1px solid #1e293b",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#64748b",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
};

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #1e293b",
  padding: "0 8px",
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px 4px",
  background: "none",
  border: "none",
  borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
  color: active ? "#3b82f6" : "#64748b",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  transition: "color 0.15s",
});

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "8px 12px",
};

const cardStyle: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 8,
  padding: 12,
  marginBottom: 10,
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  marginBottom: 8,
};

const modelNameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  color: "#f1f5f9",
};

const manufacturerStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  marginTop: 2,
};

const specGridStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 20,
  border: `1px solid ${active ? "#3b82f6" : "#334155"}`,
  background: active ? "#1d4ed8" : "transparent",
  color: active ? "#fff" : "#94a3b8",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: active ? 600 : 400,
});
