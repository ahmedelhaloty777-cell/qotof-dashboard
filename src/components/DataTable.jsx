import React, { useState, useMemo } from 'react'

export default function DataTable({
  columns,
  data,
  onRowClick,
  onSort,
  pageSize = 15,
  selectable,
  selectedRows,
  onSelectChange,
  bulkActions,
  emptyMessage = 'لا توجد بيانات',
  emptyIcon = '📭'
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)

  const handleSort = (key) => {
    if (sortKey === key) {
      const newDir = sortDir === 'asc' ? 'desc' : 'asc'
      setSortDir(newDir)
      onSort?.(key, newDir)
    } else {
      setSortKey(key)
      setSortDir('asc')
      onSort?.(key, 'asc')
    }
    setPage(0)
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = typeof aVal === 'string'
        ? aVal.localeCompare(bVal, 'ar')
        : aVal - bVal
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const pageData = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  const allSelected = pageData.length > 0 && pageData.every(row => selectedRows?.includes(row.id))
  const someSelected = pageData.some(row => selectedRows?.includes(row.id))

  const toggleAll = () => {
    if (allSelected) {
      onSelectChange?.(selectedRows.filter(id => !pageData.find(r => r.id === id)))
    } else {
      const newIds = new Set([...(selectedRows || []), ...pageData.map(r => r.id)])
      onSelectChange?.([...newIds])
    }
  }

  const toggleRow = (id) => {
    if (selectedRows?.includes(id)) {
      onSelectChange?.(selectedRows.filter(s => s !== id))
    } else {
      onSelectChange?.([...(selectedRows || []), id])
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">{emptyIcon}</div>
          <div className="empty-state-text">{emptyMessage}</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {selectedRows?.length > 0 && bulkActions && (
        <div className="bulk-bar">
          <span>تم تحديد {selectedRows.length} عنصر</span>
          {bulkActions.map((action, i) => (
            <button key={i} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={() => action.onAction(selectedRows)}>
              {action.label}
            </button>
          ))}
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => onSelectChange?.([])}>
            إلغاء التحديد
          </button>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 40, cursor: 'default' }}>
                  <input
                    type="checkbox"
                    className="bulk-checkbox"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={sortKey === col.key ? 'sorted' : ''}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                  {col.sortable !== false && (
                    <span className="sort-icon">
                      {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(row => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? 'pointer' : undefined }}
              >
                {selectable && (
                  <td onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="bulk-checkbox"
                      checked={selectedRows?.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button>
          {getPageNumbers(currentPage, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} style={{ color: 'var(--text-muted)', fontSize: 12 }}>...</span>
            ) : (
              <button key={p} className={currentPage === p ? 'active' : ''} onClick={() => setPage(p)}>
                {p + 1}
              </button>
            )
          )}
          <button disabled={currentPage >= totalPages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
          <span className="pagination-info">{sorted.length} نتيجة</span>
        </div>
      )}
    </div>
  )
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages = []
  if (current > 2) { pages.push(0); if (current > 3) pages.push('...') }
  for (let i = Math.max(0, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 3) { if (current < total - 4) pages.push('...'); pages.push(total - 1) }
  return pages
}

export { getPageNumbers }
