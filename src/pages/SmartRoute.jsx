import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import StatusBadge from '../components/StatusBadge'

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

function waRating(order) {
  return encodeURIComponent(
    `مرحبا ${order.customerName || 'عميلنا'}،\nنرجو تقييم تجربتك مع قطوف (1-5):\nممتاز - جيد - مقبول - سيئ`
  )
}

function waOffer() {
  return encodeURIComponent(
    `مرحبا، قطوف عندها عروض اليوم! 🥬\nتشكيلة مميزة من الخضروات والفواكه الطازجة.\nاطلب الآن عبر التطبيق!`
  )
}

const MARKET_COORDS = { lat: 29.943, lng: 30.920 }

export default function SmartRoute() {
  const { orders, updateOrder, addToast, dispatch } = useApp()

  const activeOrders = useMemo(() =>
    orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.lat && o.lng),
    [orders]
  )

  const grouped = useMemo(() => {
    const groups = {}
    activeOrders.forEach(o => {
      const zone = o.zone || 'منطقة أخرى'
      if (!groups[zone]) groups[zone] = []
      groups[zone].push(o)
    })
    return groups
  }, [activeOrders])

  const route = useMemo(() => {
    const stops = [MARKET_COORDS]
    const visited = new Set()
    let remaining = [...activeOrders]

    while (remaining.length > 0) {
      const last = stops[stops.length - 1]
      let nearestIdx = 0
      let nearestDist = Infinity
      remaining.forEach((o, i) => {
        const dist = Math.sqrt(
          Math.pow((o.lat || 0) - last.lat, 2) +
          Math.pow((o.lng || 0) - last.lng, 2)
        )
        if (dist < nearestDist) {
          nearestDist = dist
          nearestIdx = i
        }
      })
      const nearest = remaining[nearestIdx]
      stops.push({ lat: nearest.lat, lng: nearest.lng, order: nearest })
      remaining.splice(nearestIdx, 1)
    }

    return stops
  }, [activeOrders])

  const estimatedKm = useMemo(() => {
    let total = 0
    for (let i = 1; i < route.length; i++) {
      total += Math.sqrt(
        Math.pow(route[i].lat - route[i-1].lat, 2) +
        Math.pow(route[i].lng - route[i-1].lng, 2)
      ) * 111
    }
    return Math.round(total)
  }, [route])

  const markDelivered = (id) => {
    updateOrder(id, { status: 'delivered' })
    addToast('✅ تم التوصيل', 'success')
  }

  const zoneColors = ['#7BAA4D', '#E9D8A6', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🧭 خط التوصيل</h1>
          <p className="page-subtitle">الطريق الأمثل للتوصيل</p>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'delivery' })}>
          📋 العودة للتوصيل
        </button>
      </div>

      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>الطلبات</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{activeOrders.length}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>المناطق</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{Object.keys(grouped).length}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>المسافة</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{estimatedKm} كم</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>الوقت التقريبي</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{Math.ceil(estimatedKm / 30 + activeOrders.length * 5)} د</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h2 className="card-title">الطريق — من السوق إلى العملاء</h2>
          {route.length > 1 && (
            <a
              href={`https://www.google.com/maps/dir/${route.map(r => `${r.lat},${r.lng}`).join('/')}`}
              target="_blank"
              className="btn btn-sm btn-primary"
            >
              🗺️ فتح في خرائط Google
            </a>
          )}
        </div>
        <div>
          {route.map((stop, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              borderBottom: i < route.length - 1 ? '1px solid var(--border-light)' : 'none',
              background: i === 0 ? 'var(--border-light)' : undefined,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i === 0 ? 'var(--primary)' : 'var(--secondary)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                {stop.order ? (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {stop.order.customerName || 'عميل'}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>{stop.order.zone || ''}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      طلب #{stop.order.id?.slice(-6)} — {stop.order.total || 0} ج.م
                    </div>
                  </div>
                ) : (
                  <div style={{ fontWeight: 600 }}>سوق قطوف (نقطة الانطلاق)</div>
                )}
              </div>
              {stop.order && (
                <div className="flex gap-2">
                  <StatusBadge status={stop.order.status} />
                  <a href={`https://wa.me/${stop.order.phone?.replace(/^0/, '20')}?text=${waOnWay(stop.order)}`} target="_blank" className="btn btn-sm btn-ghost" title="السائق في الطريق">🚚</a>
                  <a href={`https://wa.me/${stop.order.phone?.replace(/^0/, '20')}?text=${waDelivered(stop.order)}`} target="_blank" className="btn btn-sm btn-ghost" title="تم التوصيل">✅</a>
                  <a href={`https://wa.me/${stop.order.phone?.replace(/^0/, '20')}?text=${waOffer()}`} target="_blank" className="btn btn-sm btn-ghost" title="عرض">🎁</a>
                  <a href={`https://wa.me/${stop.order.phone?.replace(/^0/, '20')}?text=${waRating(stop.order)}`} target="_blank" className="btn btn-sm btn-ghost" title="تقييم">⭐</a>
                  <a href={`https://www.google.com/maps?q=${stop.order.lat},${stop.order.lng}`} target="_blank" className="btn btn-sm btn-ghost">🗺️</a>
                  {stop.order.status !== 'delivered' && (
                    <button className="btn btn-sm btn-success" onClick={() => markDelivered(stop.order.id)}>✅</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {activeOrders.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🧭</div>
            <div className="empty-state-text">لا توجد طلبات نشطة</div>
          </div>
        )}
      </div>

      {Object.entries(grouped).map(([zone, zoneOrders], zi) => (
        <div key={zone} className="card mb-3">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: zoneColors[zi % zoneColors.length], display: 'inline-block' }} />
              {zone}
              <span className="badge badge-neutral" style={{ marginRight: 8 }}>{zoneOrders.length}</span>
            </h3>
          </div>
          {zoneOrders.map(order => (
            <div key={order.id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{order.customerName || 'عميل'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 12 }}>#{order.id?.slice(-6)}</span>
              </div>
              <div className="flex-center gap-2">
                <StatusBadge status={order.status} />
                <span style={{ fontWeight: 600 }}>{order.total || 0} ج.م</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
