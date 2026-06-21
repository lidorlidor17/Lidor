import { useState } from 'react'
import { X, FileText, Loader2, Download } from 'lucide-react'
import { reportsApi } from '../../api/client'

interface ReportOptions {
  title: string
  author: string
  projectNumber: string
  includeComponentList: boolean
  includeCostEstimate: boolean
  includeCalculations: boolean
}

interface ReportPanelProps {
  siteId: string
  siteName?: string
  onClose: () => void
}

export function ReportPanel({ siteId, siteName, onClose }: ReportPanelProps) {
  const defaultTitle = siteName ? `${siteName} - Engineering Report` : 'BESS Site - Engineering Report'

  const [options, setOptions] = useState<ReportOptions>({
    title: defaultTitle,
    author: '',
    projectNumber: '',
    includeComponentList: true,
    includeCostEstimate: true,
    includeCalculations: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(field: keyof ReportOptions, value: string | boolean) {
    setOptions((prev) => ({ ...prev, [field]: value }))
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await reportsApi.generate(siteId, {
        title: options.title,
        author: options.author,
        project_number: options.projectNumber,
        include_component_list: options.includeComponentList,
        include_cost_estimate: options.includeCostEstimate,
        include_calculations: options.includeCalculations,
      })

      // Trigger file download from blob response
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const filename = options.title
        ? `${options.title.replace(/[^a-z0-9-￿]/gi, '_')}.pdf`
        : `bess_report_${siteId}.pdf`
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      onClose()
    } catch {
      setError('שגיאה ביצירת הדוח. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">יצירת דוח הנדסי</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="report-title">
              כותרת הדוח
            </label>
            <input
              id="report-title"
              type="text"
              value={options.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="BESS Site - Engineering Report"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="report-author">
              שם המחבר / מהנדס
            </label>
            <input
              id="report-author"
              type="text"
              value={options.author}
              onChange={(e) => handleChange('author', e.target.value)}
              placeholder="ישראל ישראלי"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Project Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="report-project-number">
              מספר פרויקט
            </label>
            <input
              id="report-project-number"
              type="text"
              value={options.projectNumber}
              onChange={(e) => handleChange('projectNumber', e.target.value)}
              placeholder="PRJ-2026-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Checkboxes */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">תוכן הדוח</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeComponentList}
                  onChange={(e) => handleChange('includeComponentList', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">רשימת רכיבים (Component List)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeCostEstimate}
                  onChange={(e) => handleChange('includeCostEstimate', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">הערכת עלות (Cost Estimate)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeCalculations}
                  onChange={(e) => handleChange('includeCalculations', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">חישובים הנדסיים (Calculations)</span>
              </label>
            </div>
          </fieldset>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מייצר דוח...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
