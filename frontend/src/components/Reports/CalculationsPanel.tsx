import { useState } from 'react'
import { RefreshCw, Zap, Map, DollarSign, Cable, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { calculationsApi } from '../../api/client'
import type { BESSComponent, CapacityResult } from '../../types'

interface LandUseResult {
  total_area_m2: number
  battery_area_m2: number
  pcs_area_m2: number
  infrastructure_area_m2: number
  utilization_percent: number
}

interface CostResult {
  battery_cost: number
  pcs_cost: number
  civil_cost: number
  total_cost: number
  cost_per_kwh: number
}

interface CableResult {
  current_a: number
  cable_size_mm2: number
  voltage_drop_percent: number
}

interface CalculationsPanelProps {
  siteId: string
  components: BESSComponent[]
  siteAreaM2?: number
}

function SectionHeader({
  icon,
  title,
  expanded,
  onToggle,
}: {
  icon: React.ReactNode
  title: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3 text-right bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
    >
      <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
        {icon}
        {title}
      </div>
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
  )
}

function DataRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800 tabular-nums">{value}</span>
    </div>
  )
}

function formatUSD(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function CalculationsPanel({ siteId, components, siteAreaM2 = 0 }: CalculationsPanelProps) {
  const [capacity, setCapacity] = useState<CapacityResult | null>(null)
  const [landUse, setLandUse] = useState<LandUseResult | null>(null)
  const [cost, setCost] = useState<CostResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cable sizing form
  const [cablePowerKw, setCablePowerKw] = useState<string>('500')
  const [cableVoltageV, setCableVoltageV] = useState<string>('400')
  const [cableDistanceM, setCableDistanceM] = useState<string>('100')
  const [cableResult, setCableResult] = useState<CableResult | null>(null)
  const [cableLoading, setCableLoading] = useState(false)
  const [cableError, setCableError] = useState<string | null>(null)

  // Section expand state
  const [sections, setSections] = useState({
    capacity: true,
    landUse: true,
    cost: true,
    cable: true,
  })

  function toggleSection(key: keyof typeof sections) {
    setSections((s) => ({ ...s, [key]: !s[key] }))
  }

  async function handleRecalculate() {
    setError(null)
    setLoading(true)
    try {
      const [capResp, costResp, landResp] = await Promise.all([
        calculationsApi.capacity(components, siteAreaM2),
        calculationsApi.costEstimate(components, siteAreaM2),
        calculationsApi.landUse(components, siteAreaM2),
      ])
      setCapacity(capResp.data)
      setCost((costResp.data as { cost: CostResult }).cost)
      setLandUse(landResp.data as unknown as LandUseResult)
    } catch {
      setError('שגיאה בחישוב. בדוק את החיבור לשרת.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCableCalculate(e: React.FormEvent) {
    e.preventDefault()
    setCableError(null)
    setCableLoading(true)
    try {
      const resp = await calculationsApi.cableSizing(
        parseFloat(cablePowerKw),
        parseFloat(cableVoltageV),
        parseFloat(cableDistanceM),
      )
      setCableResult(resp.data as unknown as CableResult)
    } catch {
      setCableError('שגיאה בחישוב כבלים.')
    } finally {
      setCableLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-y-auto w-72">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h3 className="text-sm font-semibold text-gray-700">חישובים הנדסיים</h3>
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70"
          title="חשב מחדש"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          חשב מחדש
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {!capacity && !loading && (
        <div className="px-4 py-6 text-center text-xs text-gray-400">
          לחץ &quot;חשב מחדש&quot; כדי לחשב
        </div>
      )}

      {/* ── סיכום קיבולת ── */}
      <div className="border-b border-gray-200">
        <SectionHeader
          icon={<Zap className="w-4 h-4 text-yellow-500" />}
          title="סיכום קיבולת"
          expanded={sections.capacity}
          onToggle={() => toggleSection('capacity')}
        />
        {sections.capacity && capacity && (
          <div className="px-4 py-3">
            <DataRow label="אנרגיה כוללת" value={`${capacity.total_capacity_mwh.toFixed(1)} MWh`} />
            <DataRow label="הספק כולל" value={`${capacity.total_power_mw.toFixed(1)} MW`} />
            <DataRow label="C-Rate" value={`${capacity.c_rate.toFixed(2)} h⁻¹`} />
            <DataRow label="מכלי סוללות" value={capacity.num_battery_containers} />
            <DataRow label="יחידות PCS" value={capacity.num_pcs_units} />
            <DataRow label="נצילות משוערת" value={`${Math.round(capacity.estimated_efficiency * 100)}%`} />
          </div>
        )}
        {sections.capacity && !capacity && !loading && (
          <div className="px-4 py-3 text-xs text-gray-400 italic">אין נתונים</div>
        )}
      </div>

      {/* ── שימוש בקרקע ── */}
      <div className="border-b border-gray-200">
        <SectionHeader
          icon={<Map className="w-4 h-4 text-green-600" />}
          title="שימוש בקרקע"
          expanded={sections.landUse}
          onToggle={() => toggleSection('landUse')}
        />
        {sections.landUse && landUse && (
          <div className="px-4 py-3">
            <DataRow label="שטח אתר כולל" value={`${landUse.total_area_m2.toLocaleString()} m²`} />
            <DataRow
              label="שטח סוללות"
              value={`${landUse.battery_area_m2.toLocaleString()} m² (${landUse.total_area_m2 > 0 ? Math.round((landUse.battery_area_m2 / landUse.total_area_m2) * 100) : 0}%)`}
            />
            <DataRow
              label="שטח PCS"
              value={`${landUse.pcs_area_m2.toLocaleString()} m² (${landUse.total_area_m2 > 0 ? Math.round((landUse.pcs_area_m2 / landUse.total_area_m2) * 100) : 0}%)`}
            />
            <DataRow
              label="תשתיות"
              value={`${landUse.infrastructure_area_m2.toLocaleString()} m² (${landUse.total_area_m2 > 0 ? Math.round((landUse.infrastructure_area_m2 / landUse.total_area_m2) * 100) : 0}%)`}
            />
            <DataRow label="ניצול שטח" value={`${landUse.utilization_percent}%`} />
          </div>
        )}
        {sections.landUse && !landUse && !loading && (
          <div className="px-4 py-3 text-xs text-gray-400 italic">אין נתונים</div>
        )}
      </div>

      {/* ── הערכת עלות ── */}
      <div className="border-b border-gray-200">
        <SectionHeader
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
          title="הערכת עלות"
          expanded={sections.cost}
          onToggle={() => toggleSection('cost')}
        />
        {sections.cost && cost && (
          <div className="px-4 py-3">
            <DataRow label="עלות סוללות" value={formatUSD(cost.battery_cost)} />
            <DataRow label="עלות PCS" value={formatUSD(cost.pcs_cost)} />
            <DataRow label="תשתית / אזרחי" value={formatUSD(cost.civil_cost)} />
            <div className="mt-2 pt-2 border-t border-gray-200">
              <DataRow
                label="סה״כ משוער"
                value={formatUSD(cost.total_cost)}
              />
              <DataRow
                label="עלות לkWh"
                value={`$${cost.cost_per_kwh.toFixed(0)}/kWh`}
              />
            </div>
          </div>
        )}
        {sections.cost && !cost && !loading && (
          <div className="px-4 py-3 text-xs text-gray-400 italic">אין נתונים</div>
        )}
      </div>

      {/* ── חישוב כבלים ── */}
      <div>
        <SectionHeader
          icon={<Cable className="w-4 h-4 text-purple-600" />}
          title="חישוב כבלים"
          expanded={sections.cable}
          onToggle={() => toggleSection('cable')}
        />
        {sections.cable && (
          <div className="px-4 py-3">
            <form onSubmit={handleCableCalculate} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">הספק (kW)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={cablePowerKw}
                  onChange={(e) => setCablePowerKw(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">מתח (V)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={cableVoltageV}
                  onChange={(e) => setCableVoltageV(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">מרחק (m)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={cableDistanceM}
                  onChange={(e) => setCableDistanceM(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={cableLoading}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-70"
              >
                {cableLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cable className="w-3.5 h-3.5" />
                )}
                חשב גודל כבל
              </button>
            </form>

            {cableError && (
              <div className="mt-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {cableError}
              </div>
            )}

            {cableResult && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                <DataRow label="זרם" value={`${cableResult.current_a.toFixed(1)} A`} />
                <DataRow label="חתך כבל" value={`${cableResult.cable_size_mm2} mm²`} />
                <DataRow
                  label="נפילת מתח"
                  value={`${cableResult.voltage_drop_percent.toFixed(2)}%`}
                />
                {cableResult.voltage_drop_percent > 5 && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠ נפילת מתח גבוהה מ-5% — שקול להגדיל חתך
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer to allow scroll past sticky header */}
      <div className="pb-4" />
    </div>
  )
}
