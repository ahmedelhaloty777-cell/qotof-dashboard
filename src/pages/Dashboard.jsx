import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import DataTable from '../components/DataTable'

function last7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export default function Dashboard() {
  const { orders, products, customers, expenses } = useApp()

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(today))
    const pending = orders.filter(o => o.status === 'pending')
    const delivered = orders.filter(o => o.status === 'delivered')
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)
    const todayRevenue = todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)

    const days = last7Days()
    const dailyOrders = days.map(day => orders.filter(o => o.createdAt?.startsWith(day)).length)
    const dailyRevenue = days.map(day =>
      orders.filter(o => o.createdAt?.startsWith(day) && o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)
    )
    const dailyCustomers = days.map(day => customers.filter(c => (c.createdAt || '').startsWith(day)).length)
    const dailyNewOrders = days.map(day => orders.filter(o => o.createdAt?.startsWith(day) && o.status === 'pending').length)
    const dailyDelivered = days.map(day => orders.filter(o => o.createdAt?.startsWith(day) && o.status === 'delivered').length)

    const avgOrders = dailyOrders.reduce((s, v) => s + v, 0) / 7
    const lastWeekOrders = dailyOrders.reduce((s, v) => s + v, 0)
    const prevWeekOrders = orders.length - lastWeekOrders
    const orderChange = prevWeekOrders > 0 ? Math.round(((lastWeekOrders - prevWeekOrders) / prevWeekOrders) * 100) : 0

    const avgRevenue = dailyRevenue.reduce((s, v) => s + v, 0)
    const prevRevenue = revenue - avgRevenue
    const revenueChange = prevRevenue > 0 ? Math.round(((avgRevenue - prevRevenue) / prevRevenue) * 100) : 0

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      pending,
      delivered: delivered.length,
      revenue,
      todayRevenue,
      productsCount: products.length,
      customersCount: customers.length,
      avgOrder: orders.length ? Math.round(revenue / orders.length) : 0,
      dailyOrders,
      dailyRevenue,
      dailyCustomers,
      dailyNewOrders,
      dailyDelivered,
      orderChange,
      revenueChange,
    }
  }, [orders, products, customers])

  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    [orders]
  )

  const columns = [
    { key: 'id', label: '#', render: r => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>#{r.id?.slice(-6)}</span> },
    { key: 'customerName', label: 'العميل' },
    { key: 'total', label: 'الإجمالي', render: r => `${r.total || 0} ج.م` },
    { key: 'status', label: 'الحالة', render: r => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'التاريخ', render: r => new Date(r.createdAt).toLocaleDateString('ar-EG') },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة التحكم</h1>
          <p className="page-subtitle">نظرة عامة على أداء المتجر</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="إجمالي الطلبات" value={stats.totalOrders} icon="📋" change={stats.orderChange} changeLabel="آخر 7 أيام" data={stats.dailyOrders} />
        <KPICard label="طلبات اليوم" value={stats.todayOrders} icon="📦" color="info" data={stats.dailyNewOrders} />
        <KPICard label="قيد الانتظار" value={stats.pending.length} icon="⏳" color="warning" data={stats.dailyNewOrders} />
        <KPICard label="تم التوصيل" value={stats.delivered} icon="✅" color="success" data={stats.dailyDelivered} />
        <KPICard label="إجمالي الإيرادات" value={`${stats.revenue.toLocaleString()} ج.م`} icon="💰" change={stats.revenueChange} changeLabel="آخر 7 أيام" data={stats.dailyRevenue} />
        <KPICard label="إيرادات اليوم" value={`${stats.todayRevenue.toLocaleString()} ج.م`} icon="💵" color="info" data={stats.dailyRevenue} />
        <KPICard label="متوسط الطلب" value={`${stats.avgOrder} ج.م`} icon="📊" data={stats.dailyRevenue} />
        <KPICard label="المنتجات" value={stats.productsCount} icon="📦" color="success" data={stats.dailyCustomers} />
        <KPICard label="العملاء" value={stats.customersCount} icon="👥" data={stats.dailyCustomers} />
      </div>

      <div className="card" style={{ marginTop: 8 }}>
        <div className="flex-between mb-3">
          <h2 className="card-title">أحدث الطلبات</h2>
          <span className="text-sm text-muted">{recentOrders.length} طلب</span>
        </div>
        <DataTable
          columns={columns}
          data={recentOrders}
          emptyMessage="لا توجد طلبات حتى الآن"
          emptyIcon="📭"
        />
      </div>
    </div>
  )
}
