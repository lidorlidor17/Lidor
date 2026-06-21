import { useState } from "react";
import axios from "axios";

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

interface ShortCircuitResult {
  isc_ka: number;
  isc_peak_ka: number;
  breaking_capacity_ka: number;
  recommended_cb: string;
}

interface ProtectionResult {
  overcurrent_relay_setting_a: number;
  earth_fault_relay_setting_a: number;
  fuse_rating_a: number;
  cable_protection_ok: boolean;
  thermal_withstand_ok: boolean;
}

interface PowerQualityResult {
  thd_voltage_percent: number;
  power_factor: number;
  flicker_pst: number;
  grid_code_compliant: boolean;
  recommendations: string[];
}

interface GroundingResult {
  grid_spacing_m: number;
  num_earth_rods: number;
  rod_depth_m: number;
  earthing_resistance_ohm: number;
  meets_iec_requirement: boolean;
  conductor_size_mm2: number;
  note: string;
}

// ---------------------------------------------------------------------------
// Generic form primitives
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  type?: string;
  min?: number;
  step?: number;
}

function Field({ label, value, onChange, unit, type = "number", min, step }: FieldProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>
        {label}
        {unit && <span style={{ color: "#64748b", marginLeft: 4 }}>({unit})</span>}
      </label>
      <input
        type={type}
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

interface CalcButtonProps {
  loading: boolean;
  onClick: () => void;
}
function CalcButton({ loading, onClick }: CalcButtonProps) {
  return (
    <button onClick={onClick} disabled={loading} style={calcBtnStyle}>
      {loading ? "Calculating..." : "Calculate"}
    </button>
  );
}

interface StatusPillProps {
  ok: boolean;
  okText?: string;
  failText?: string;
}
function StatusPill({ ok, okText = "Pass", failText = "Fail" }: StatusPillProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 700,
        background: ok ? "#14532d" : "#7f1d1d",
        color: ok ? "#4ade80" : "#f87171",
      }}
    >
      {ok ? okText : failText}
    </span>
  );
}

function ResultRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid #1e293b",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
        border: "1px solid #334155",
      }}
    >
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
        Results
      </p>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "8px 12px",
        background: "#7f1d1d",
        borderRadius: 6,
        color: "#fca5a5",
        fontSize: 12,
      }}
    >
      {msg}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Short Circuit (קצר חשמלי)
// ---------------------------------------------------------------------------

function ShortCircuitTab() {
  const [kva, setKva] = useState("1600");
  const [voltage, setVoltage] = useState("0.69");
  const [impedance, setImpedance] = useState("6.0");
  const [result, setResult] = useState<ShortCircuitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post<ShortCircuitResult>(
        "/api/catalog/calculations/short-circuit",
        {
          transformer_kva: parseFloat(kva),
          voltage_kv: parseFloat(voltage),
          impedance_percent: parseFloat(impedance),
        }
      );
      setResult(data);
    } catch (e) {
      setError("Calculation failed. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={sectionDescStyle}>
        Three-phase fault current per IEC 60909. Used to select circuit breaker breaking capacity.
      </p>
      <Field label="Transformer Rating" value={kva} onChange={setKva} unit="kVA" min={1} />
      <Field label="System Voltage" value={voltage} onChange={setVoltage} unit="kV" min={0.001} step={0.001} />
      <Field label="Transformer Impedance" value={impedance} onChange={setImpedance} unit="%" min={0.1} step={0.1} />
      <CalcButton loading={loading} onClick={calculate} />
      {error && <ErrorMsg msg={error} />}
      {result && (
        <ResultCard>
          <ResultRow label="Symmetrical Isc" value={`${result.isc_ka} kA`} />
          <ResultRow label="Peak Isc" value={`${result.isc_peak_ka} kA`} />
          <ResultRow label="Required Breaking Capacity" value={`${result.breaking_capacity_ka} kA`} />
          <ResultRow label="Recommended CB" value={result.recommended_cb} />
        </ResultCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Protection (הגנות)
// ---------------------------------------------------------------------------

function ProtectionTab() {
  const [current, setCurrent] = useState("400");
  const [cableSize, setCableSize] = useState("95");
  const [cableLength, setCableLength] = useState("50");
  const [result, setResult] = useState<ProtectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post<ProtectionResult>(
        "/api/catalog/calculations/protection",
        {
          rated_current_a: parseFloat(current),
          cable_size_mm2: parseFloat(cableSize),
          cable_length_m: parseFloat(cableLength),
        }
      );
      setResult(data);
    } catch {
      setError("Calculation failed. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={sectionDescStyle}>
        Relay and fuse settings per IEC 60255 / IEC 60364. Validates cable suitability.
      </p>
      <Field label="Rated Current" value={current} onChange={setCurrent} unit="A" min={1} />
      <Field label="Cable Size" value={cableSize} onChange={setCableSize} unit="mm²" min={1} />
      <Field label="Cable Length" value={cableLength} onChange={setCableLength} unit="m" min={1} />
      <CalcButton loading={loading} onClick={calculate} />
      {error && <ErrorMsg msg={error} />}
      {result && (
        <ResultCard>
          <ResultRow
            label="Overcurrent Relay Pick-up"
            value={`${result.overcurrent_relay_setting_a} A`}
          />
          <ResultRow
            label="Earth Fault Relay Pick-up"
            value={`${result.earth_fault_relay_setting_a} A`}
          />
          <ResultRow label="Fuse Rating" value={`${result.fuse_rating_a} A`} />
          <ResultRow
            label="Cable Size OK"
            value={<StatusPill ok={result.cable_protection_ok} okText="Suitable" failText="Undersized" />}
          />
          <ResultRow
            label="Thermal Withstand"
            value={<StatusPill ok={result.thermal_withstand_ok} okText="OK" failText="Upgrade Cable" />}
          />
        </ResultCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Power Quality (איכות חשמל)
// ---------------------------------------------------------------------------

function PowerQualityTab() {
  const [pcsCount, setPcsCount] = useState("2");
  const [power, setPower] = useState("5000");
  const [faultLevel, setFaultLevel] = useState("100");
  const [result, setResult] = useState<PowerQualityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post<PowerQualityResult>(
        "/api/catalog/calculations/power-quality",
        {
          pcs_count: parseInt(pcsCount),
          total_power_kw: parseFloat(power),
          grid_fault_level_mva: parseFloat(faultLevel),
        }
      );
      setResult(data);
    } catch {
      setError("Calculation failed. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={sectionDescStyle}>
        THD, power factor and flicker assessment per EN 50549 / IEC 61000-3-2.
      </p>
      <Field label="Number of PCS Units" value={pcsCount} onChange={setPcsCount} unit="units" min={1} step={1} />
      <Field label="Total BESS Power" value={power} onChange={setPower} unit="kW" min={1} />
      <Field label="Grid Fault Level at PCC" value={faultLevel} onChange={setFaultLevel} unit="MVA" min={1} />
      <CalcButton loading={loading} onClick={calculate} />
      {error && <ErrorMsg msg={error} />}
      {result && (
        <ResultCard>
          <ResultRow label="THD Voltage" value={`${result.thd_voltage_percent} %`} />
          <ResultRow label="Power Factor" value={result.power_factor.toFixed(3)} />
          <ResultRow label="Flicker Pst" value={result.flicker_pst.toFixed(2)} />
          <ResultRow
            label="Grid Code Compliant (EN 50549)"
            value={<StatusPill ok={result.grid_code_compliant} okText="Compliant" failText="Non-Compliant" />}
          />
          {result.recommendations.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, margin: "0 0 6px" }}>
                Recommendations
              </p>
              {result.recommendations.map((r, i) => (
                <p key={i} style={{ color: "#fcd34d", fontSize: 12, margin: "0 0 4px" }}>
                  • {r}
                </p>
              ))}
            </div>
          )}
        </ResultCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Grounding (הארקה)
// ---------------------------------------------------------------------------

function GroundingTab() {
  const [area, setArea] = useState("5000");
  const [resistivity, setResistivity] = useState("100");
  const [result, setResult] = useState<GroundingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post<GroundingResult>(
        "/api/catalog/calculations/grounding",
        {
          site_area_m2: parseFloat(area),
          soil_resistivity_ohm_m: parseFloat(resistivity),
        }
      );
      setResult(data);
    } catch {
      setError("Calculation failed. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={sectionDescStyle}>
        Earthing grid design per IEC 60364-5-54 / IEEE Std 80. Calculates grid resistance.
      </p>
      <Field label="Site Area" value={area} onChange={setArea} unit="m²" min={1} />
      <Field label="Soil Resistivity" value={resistivity} onChange={setResistivity} unit="Ω·m" min={1} />
      <CalcButton loading={loading} onClick={calculate} />
      {error && <ErrorMsg msg={error} />}
      {result && (
        <ResultCard>
          <ResultRow label="Grid Conductor Spacing" value={`${result.grid_spacing_m} m`} />
          <ResultRow label="Number of Earth Rods" value={result.num_earth_rods} />
          <ResultRow label="Rod Depth" value={`${result.rod_depth_m} m`} />
          <ResultRow label="Earthing Resistance" value={`${result.earthing_resistance_ohm} Ω`} />
          <ResultRow label="Conductor Size" value={`${result.conductor_size_mm2} mm² Cu`} />
          <ResultRow
            label="IEC 60364-5-54 (R < 1 Ω)"
            value={<StatusPill ok={result.meets_iec_requirement} okText="Pass" failText="Fail – Increase Rods" />}
          />
          <p style={{ color: "#64748b", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>
            {result.note}
          </p>
        </ResultCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type CalcTab = "short-circuit" | "protection" | "power-quality" | "grounding";

interface TabDef {
  id: CalcTab;
  labelHe: string;
  labelEn: string;
}

const TABS: TabDef[] = [
  { id: "short-circuit",  labelHe: "קצר חשמלי",  labelEn: "Short Circuit" },
  { id: "protection",     labelHe: "הגנות",        labelEn: "Protection" },
  { id: "power-quality",  labelHe: "איכות חשמל",  labelEn: "Power Quality" },
  { id: "grounding",      labelHe: "הארקה",        labelEn: "Grounding" },
];

export interface ElectricalCalculationsProps {
  siteId: string;
}

export function ElectricalCalculations({ siteId: _siteId }: ElectricalCalculationsProps) {
  const [activeTab, setActiveTab] = useState<CalcTab>("short-circuit");

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>
          Electrical Calculations
        </span>
        <span style={{ fontSize: 11, color: "#64748b" }}>IEC Standards</span>
      </div>

      {/* Tab bar */}
      <div style={tabBarStyle}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={tabStyle(activeTab === t.id)}
            title={t.labelEn}
          >
            <div style={{ fontSize: 12 }}>{t.labelHe}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{t.labelEn}</div>
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div style={contentStyle}>
        {activeTab === "short-circuit" && <ShortCircuitTab />}
        {activeTab === "protection" && <ProtectionTab />}
        {activeTab === "power-quality" && <PowerQualityTab />}
        {activeTab === "grounding" && <GroundingTab />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  width: 380,
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 10,
  display: "flex",
  flexDirection: "column",
  fontFamily: "Inter, system-ui, sans-serif",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 16px",
  borderBottom: "1px solid #1e293b",
};

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #1e293b",
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "8px 4px",
  background: active ? "#1e293b" : "none",
  border: "none",
  borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
  color: active ? "#3b82f6" : "#64748b",
  cursor: "pointer",
  textAlign: "center",
  transition: "all 0.15s",
});

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 16,
};

const sectionDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.5,
  marginBottom: 14,
  padding: "8px 10px",
  background: "#1e293b",
  borderRadius: 6,
  borderLeft: "3px solid #3b82f6",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 4,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 6,
  color: "#f1f5f9",
  fontSize: 13,
  boxSizing: "border-box",
  outline: "none",
};

const calcBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700,
  marginTop: 4,
};
