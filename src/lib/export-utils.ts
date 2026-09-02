/**
 * Utility functions for exporting data to CSV format and triggering browser download.
 */

export function exportToCSV(filename: string, rows: (string | number)[][], headers?: string[]) {
  const allRows: (string | number)[][] = headers ? [headers, ...rows] : rows

  const csvContent = allRows
    .map((row) =>
      row
        .map((val) => {
          if (val === null || val === undefined) return '""'
          const str = String(val).replace(/"/g, '""')
          return `"${str}"`
        })
        .join(",")
    )
    .join("\r\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
