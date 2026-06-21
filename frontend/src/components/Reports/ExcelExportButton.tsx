import { useState } from 'react'
import axios from 'axios'

interface ExcelExportButtonProps {
  siteId: string
  siteName: string
}

export function ExcelExportButton({ siteId, siteName }: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/export/excel/${siteId}`,
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `BESS_${siteName}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('שגיאה בייצוא האקסל')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      style={{
        background: '#16a34a',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: isExporting ? 'wait' : 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {isExporting ? '⏳ מייצא...' : '📊 ייצוא לאקסל'}
    </button>
  )
}
