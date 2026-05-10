import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import StatusBadge from '../components/StatusBadge'
import DataTable from '../components/DataTable'
import LocationInput from '../components/LocationInput'

function waOnWay(order) {
  return encodeURIComponent(
    `مرحبا ${order.customerName || 'عميلنا'}،\nالسائق في الطريق إليك الآن 🚚\nطلب رقم #${(order.id || '').slice(-6)}\nالمبلغ: ${order.total || 0} ج.م\nنتشرف بخدمتك!`
  )
}

function waDelivered(order) {
  return encodeURIComponent(
    `مرحبا ${order.customerName || 'عميلنا'}،\nتم توصيل طلبك رقم #${(order.id || '').slice(-6)} بنجاح ✅\nنتمنى أن يكون الطلب على ذوقك.\nتقيمك يهمنا ❤️`
  )
}

function waOffer() {
  return encodeURIComponent(
    `مرحبا، قطوف عندها عروض اليوم! 🥬\nتشكيلة مميزة من الخضروات والفواكه الطازجة.\nاطلب الآن عبر التطبيق!`
  )
}

export default function Delivery() {
  const { orders, drivers, updateOrder, addToast, dispatch } = useApp()

  const today = new Date().toISOString().split('T')[0]
  const pendingDelivery = useMemo(() =>
    orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled'),
    [orders]
  )

  const markDelivered = (id) => {
    updateOrder(id, { status: 'delivered' })
    addToast('✅ تم تأكيد التوصيل', 'success')
  }

  const updateZone = (id, zone) => {
    updateOrder(id, { zone })
  }

  const updateLocation = (id, lat, lng) => {
    updateOrder(id, { lat, lng })
  }

  const openInMaps = (order) => {
    if (order.lat && order.lng) {
      window.open(`https://www.google.com/maps/dir/29.943,30.920/${order.lat},${order.lng}`, '_blank')
    } else {
      addToast('الرجاء إدخال الموقع أولاً', 'warning')
    }
  }

  const columns = [
    { key: 'id', label: '#', render: r => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>#{r.id?.slice(-6)}</span>, width: 70 },
    { key: 'customerName', label: 'العميل' },
    { key: 'zone', label: 'المنطقة', render: r => (
      <input
        style={{ width: 100, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 12 }}
        value={r.zone || ''}
        onChange={e => updateZone(r.id, e.target.value)}
        onClick={e => e.stopPropagation()}
      />
    )},
    { key: 'status', label: 'الحالة', render: r => <StatusBadge status={r.status} /> },
    { key: 'driverId', label: 'السائق', render: r => {
      const driver = (drivers || []).find(d => d.id === r.driverId)
      return driver ? driver.name : '—'
    }},
    { key: 'total', label: 'المبلغ', render: r => `${r.total || 0} ج.م` },
    { key: 'actions', label: '', sortable: false, render: r => (
      <div className="flex gap-2">
        {r.phone && (
          <div className="flex gap-1">
            <a href={`https://wa.me/${r.phone.replace(/^0/, '20')}?text=${waOnWay(r)}`} target="_blank" className="btn btn-sm btn-ghost" title="السائق في الطريق" onClick={e => e.stopPropagation()}>🚚</a>
            <a href={`https://wa.me/${r.phone.replace(/^0/, '20')}?text=${waDelivered(r)}`} target="_blank" className="btn btn-sm btn-ghost" title="تم التوصيل" onClick={e => e.stopPropagation()}>✅</a>
            <a href={`https://wa.me/${r.phone.replace(/^0/, '20')}?text=${waOffer()}`} target="_blank" className="btn btn-sm btn-ghost" title="عرض" onClick={e => e.stopPropagation()}>🎁</a>
            <a href={`https://wa.me/${r.phone.replace(/^0/, '20')}?text=${encodeURIComponent(`مرحبا ${r.customerName || 'عميلنا'}،\nنرجو تقييم تجربتك مع قطوف (1-5):\nممتاز - جيد - مقبول - سيئ`)}`} target="_blank" className="btn btn-sm btn-ghost" title="تقييم" onClick={e => e.stopPropagation()}>⭐</a>
          </div>
        )}
        {r.lat && r.lng ? (
          <button className="btn btn-sm btn-ghost" onClick={e => { e.stopPropagation(); openInMaps(r) }} title="خرائط">🗺️</button>
        ) : (
          <span title="لم يتم تحديد الموقع" style={{ opacity: 0.3 }}>🗺️</span>
        )}
        {r.status !== 'delivered' && (
          <button className="btn btn-sm btn-success" onClick={e => { e.stopPropagation(); markDelivered(r.id) }}>✅ تم</button>
        )}
      </div>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">التوصيل</h1>
          <p className="page-subtitle">إدارة عملية التوصيل {pendingDelivery.length > 0 && `— ${pendingDelivery.length} طلب pending`}</p>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'smart-route' })}>
          🧭 خط التوصيل
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>بانتظار التوصيل</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{pendingDelivery.length}</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>تم اليوم</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>
            {orders.filter(o => o.status === 'delivered' && o.createdAt?.startsWith(today)).length}
          </div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>بموقع محدد</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--info)' }}>
            {pendingDelivery.filter(o => o.lat && o.lng).length}
          </div>
        </div>
      </div>

      <div className="card mb-4" style={{ borderRight: '4px solid var(--info)' }}>
        <div className="card-header">
          <h3 className="card-title">📍 تحديد مواقع العملاء</h3>
          <span className="text-sm text-muted">أضف موقع كل عميل لظهوره في خط التوصيل</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pendingDelivery.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📍</div>
              <div className="empty-state-text">لا توجد طلبات نشطة</div>
            </div>
          ) : (
            pendingDelivery.map(order => (
              <div key={order.id} className="flex-between" style={{ padding: '8px 12px', background: 'var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{order.customerName || '—'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>#{order.id?.slice(-6)}</span></div>
                  <div className="flex gap-2" style={{ marginTop: 4 }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <LocationInput
                        lat={order.lat}
                        lng={order.lng}
                        onLocationChange={(lat, lng) => updateLocation(order.id, lat, lng)}
                        label=""
                      />
                    </div>
                    {order.phone && (
                      <div className="flex gap-1">
                        <a href={`https://wa.me/${order.phone.replace(/^0/, '20')}?text=${waOnWay(order)}`} target="_blank" className="btn btn-sm btn-ghost" title="السائق في الطريق">🚚</a>
                        <a href={`https://wa.me/${order.phone.replace(/^0/, '20')}?text=${waDelivered(order)}`} target="_blank" className="btn btn-sm btn-ghost" title="تم التوصيل">✅</a>
                        <a href={`https://wa.me/${order.phone.replace(/^0/, '20')}?text=${waOffer()}`} target="_blank" className="btn btn-sm btn-ghost" title="عرض">🎁</a>
                        <a href={`https://wa.me/${order.phone.replace(/^0/, '20')}?text=${encodeURIComponent(`مرحبا ${order.customerName || 'عميلنا'}،\nنرجو تقييم تجربتك مع قطوف (1-5):\nممتاز - جيد - مقبول - سيئ`)}`} target="_blank" className="btn btn-sm btn-ghost" title="تقييم">⭐</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={pendingDelivery}
          emptyMessage="جميع الطلبات تم توصيلها! 🎉"
          emptyIcon="🎉"
        />
      </div>
    </div>
  )
}
