import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function Analytics() {
  const { orders, products } = useApp()

  const stats = useMemo(() => {
    const total = orders.length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const cancelled = orders.filter(o => o.status === 'cancelled').length
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)

    const monthlyRevenue = {}
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const month = o.createdAt ? o.createdAt.substring(0, 7) : 'unknown'
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (o.total || 0)
    })

    const productSales = {}
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const name = item.name || item.productName
        if (name) {
          productSales[name] = (productSales[name] || 0) + (item.quantity || 0)
        }
      })
    })

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    const zoneStats = {}
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const zone = o.zone || 'أخرى'
      if (!zoneStats[zone]) zoneStats[zone] = { count: 0, revenue: 0 }
      zoneStats[zone].count++
      zoneStats[zone].revenue += o.total || 0
    })

    const months = Object.keys(monthlyRevenue).sort()
    const maxRevenue = Math.max(...Object.values(monthlyRevenue), 1)

    return { total, delivered, cancelled, revenue, topProducts, monthlyRevenue, months, maxRevenue, zoneStats }
  }, [orders])

  const barChart = (data, max, label, color) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, padding: '0 8px' }}>
      {Object.entries(data).slice(-7).map(([key, val]) => (
        <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '100%', maxWidth: 40,
            height: `${(val / max) * 140}px`,
            background: color || 'var(--secondary)',
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.3s ease',
            minHeight: 4,
          }} />
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
            {key.length > 7 ? key.slice(5) : key}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 التحليلات</h1>
          <p className="page-subtitle">تحليل أداء المتجر</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card info">
          <div className="kpi-label">إجمالي الطلبات</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-label">تم التوصيل</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{stats.delivered}</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-label">ملغي</div>
          <div className="kpi-value" style={{ color: 'var(--error)' }}>{stats.cancelled}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">نسبة الإنجاز</div>
          <div className="kpi-value">{stats.total ? Math.round((stats.delivered / stats.total) * 100) : 0}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">الإيرادات</div>
          <div className="kpi-value">{stats.revenue.toLocaleString()} ج.م</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">متوسط الطلب</div>
          <div className="kpi-value">{stats.total ? Math.round(stats.revenue / stats.total) : 0} ج.م</div>
        </div>
      </div>

      <div className="grid-2 mt-4">
        <div className="card">
          <h3 className="card-title mb-3">الإيرادات الشهرية</h3>
          {Object.keys(stats.monthlyRevenue).length > 0
            ? barChart(stats.monthlyRevenue, stats.maxRevenue, 'الإيرادات', 'var(--secondary)')
            : <div className="empty-state"><div className="empty-state-text">لا توجد بيانات</div></div>
          }
        </div>
        <div className="card">
          <h3 className="card-title mb-3">أفضل المنتجات مبيعاً</h3>
          {stats.topProducts.length > 0 ? (
            <div>
              {stats.topProducts.map(([name, qty], i) => (
                <div key={name} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="flex-center gap-2">
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{qty}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">لا توجد مبيعات</div></div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="card-title mb-3">توزيع المناطق</h3>
        {Object.entries(stats.zoneStats).length > 0 ? (
          <div className="grid-3">
            {Object.entries(stats.zoneStats).map(([zone, data]) => (
              <div key={zone} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{zone}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary)' }}>{data.count}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.revenue.toLocaleString()} ج.م</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><div className="empty-state-text">لا تبيانات مناطق</div></div>
        )}
      </div>
    </div>
  )
}
