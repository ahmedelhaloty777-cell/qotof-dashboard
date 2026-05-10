import React from 'react'

export default function KPICard({ label, value, icon, change, changeLabel, color = 'primary', loading, data }) {
  if (loading) {
    return (
      <div className="kpi-card">
        <div className="skeleton skeleton-card" style={{ height: 80 }} />
      </div>
    )
  }

  const changeClass = change >= 0 ? 'up' : 'down'
  const colorClass = color === 'danger' ? 'danger' : color === 'warning' ? 'warning' : color === 'info' ? 'info' : ''

  const chartData = data && data.length > 1 ? data : null

  return (
    <div className={`kpi-card ${colorClass}`}>
      <div className="kpi-top">
        <div>
          <div className="kpi-label">{label}</div>
          <div>
            <span className="kpi-value">{value}</span>
            {change !== undefined && change !== null && (
              <span className={`kpi-change ${changeClass}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
        <div className="kpi-icon">{icon}</div>
      </div>
      {changeLabel && <div className="text-sm text-muted">{changeLabel}</div>}
      {chartData && (
        <svg className="kpi-micro-chart" viewBox="0 0 100 24" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={generateRealSparkline(chartData)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <path
            d={generateAreaPath(chartData)}
            fill={`url(#grad-${label})`}
            opacity="0.4"
          />
        </svg>
      )}
    </div>
  )
}

function generateRealSparkline(data) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  let range = max - min || 1
  if (range < 1) range = 1
  const midY = 12
  return data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = max === min ? midY : 22 - ((val - min) / range) * 18
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
}

function generateAreaPath(data) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  let range = max - min || 1
  if (range < 1) range = 1
  const midY = 12
  const line = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = max === min ? midY : 22 - ((val - min) / range) * 18
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  return `${line} L 100 24 L 0 24 Z`
}
