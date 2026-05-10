import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import LocationInput from '../components/LocationInput'

function waConfirm(order) {
  const items = (order.items || []).map(i => `- ${i.name || i.productName} x${i.quantity}`).join('\n')
  return encodeURIComponent(
    `مرحبا ${order.customerName}،\nتم تأكيد طلبك رقم #${(order.id || '').slice(-6)}:\n${items}\nالإجمالي: ${order.total || 0} ج.م\nسيتم التوصيل في أقرب وقت. شكرا لاختيارك قطوف!`
  )
}

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

function waRating(order) {
  return encodeURIComponent(
    `مرحبا ${order.customerName || 'عميلنا'}،\nنتمنى أن يكون طلبك رقم #${(order.id || '').slice(-6)} قد نال إعجابك 🌟\nنرجو تقييم تجربتك مع قطوف (1-5):\nممتاز - جيد - مقبول - سيئ`
  )
}

export default function Orders() {
  const { orders, products, customers, drivers, updateOrder, deleteOrder, addToast, selectedOrders, dispatch } = useApp()
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  const filtered = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter(o => o.status === filter)
  }, [orders, filter])

  const handleBulkStatus = (ids, status) => {
    ids.forEach(id => updateOrder(id, { status }))
    dispatch({ type: 'SET_SELECTED', payload: [] })
    addToast(`تم تحديث ${ids.length} طلب`, 'success')
  }

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      deleteOrder(id)
      addToast('تم حذف الطلب', 'success')
      setModal(null)
    }
  }

  const columns = [
    { key: 'id', label: '#', render: r => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>#{r.id?.slice(-6)}</span>, width: 70 },
    { key: 'customerName', label: 'العميل', render: r => r.customerName || '—' },
    { key: 'zone', label: 'المنطقة', render: r => r.zone || '—' },
    { key: 'items', label: 'المنتجات', render: r => {
      const items = r.items || []
      return items.length > 0
        ? items.map((it, i) => (
            <span key={i} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {it.name || it.productName}{it.quantity ? ` x${it.quantity}` : ''}{i < items.length - 1 ? ', ' : ''}
            </span>
          ))
        : '—'
    }},
    { key: 'total', label: 'الإجمالي', render: r => `${r.total || 0} ج.م` },
    { key: 'status', label: 'الحالة', render: r => <StatusBadge status={r.status} /> },
    { key: 'deliveryFee', label: 'التوصيل', render: r => r.deliveryFee ? `${r.deliveryFee} ج.م` : 'مجانًا' },
    { key: 'createdAt', label: 'التاريخ', render: r => new Date(r.createdAt).toLocaleDateString('ar-EG') },
    { key: 'actions', label: 'الإجراءات', sortable: false, render: r => (
      <div className="flex gap-2">
        <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setModal(r) }}>عرض</button>
      </div>
    )},
  ]

  const bulkActions = [
    { label: 'تأكيد', onAction: (ids) => handleBulkStatus(ids, 'confirmed') },
    { label: 'توصيل', onAction: (ids) => handleBulkStatus(ids, 'delivered') },
    { label: 'إلغاء', onAction: (ids) => handleBulkStatus(ids, 'cancelled') },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">الطلبات</h1>
          <p className="page-subtitle">إدارة ومتابعة جميع الطلبات</p>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'new-order' })}>
          ➕ طلب جديد
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'pending', label: 'قيد الانتظار' },
          { id: 'confirmed', label: 'مؤكد' },
          { id: 'on-way', label: 'في الطريق' },
          { id: 'delivered', label: 'مكتمل' },
          { id: 'cancelled', label: 'ملغي' },
        ].map(f => (
          <button
            key={f.id}
            className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filtered}
          selectable
          selectedRows={selectedOrders}
          onSelectChange={(ids) => dispatch({ type: 'SET_SELECTED', payload: ids })}
          bulkActions={bulkActions}
          emptyMessage="لا توجد طلبات"
          emptyIcon="📭"
          onRowClick={(r) => setModal(r)}
        />
      </div>

      {modal && <OrderModal order={modal} onClose={() => setModal(null)} onDelete={handleDelete} onUpdate={updateOrder} drivers={drivers} addToast={addToast} products={products} />}
    </div>
  )
}

function OrderModal({ order, onClose, onDelete, onUpdate, drivers, addToast, products }) {
  const [status, setStatus] = useState(order.status)
  const [driverId, setDriverId] = useState(order.driverId || '')
  const [editItems, setEditItems] = useState(false)
  const [itemsForm, setItemsForm] = useState((order.items || []).map(i => ({ ...i })))

  const handleSave = () => {
    const updates = { status, driverId: driverId || undefined }
    if (editItems) {
      const subtotal = itemsForm.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0)
      updates.items = itemsForm
      updates.subtotal = subtotal
      updates.total = subtotal + (order.deliveryFee || 0)
    }
    onUpdate(order.id, updates)
    addToast('تم تحديث الطلب', 'success')
    onClose()
  }

  const updateItem = (idx, field, value) => {
    setItemsForm(prev => {
      const items = [...prev]
      items[idx] = { ...items[idx], [field]: value }
      return items
    })
  }

  const addItem = () => {
    setItemsForm(prev => [...prev, { name: '', productName: '', quantity: 1, price: 0 }])
  }

  const removeItem = (idx) => {
    setItemsForm(prev => prev.filter((_, i) => i !== idx))
  }

  const itemsTotal = itemsForm.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">طلب #{order.id?.slice(-6)}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div>
              <div className="form-label">العميل</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{order.customerName || '—'}</div>
            </div>
            <div>
              <div className="form-label">المنطقة</div>
              <div>{order.zone || '—'}</div>
            </div>
            <div>
              <div className="form-label">الهاتف</div>
              <div>{order.phone || '—'}</div>
            </div>
            <div>
              <div className="form-label">العنوان</div>
              <div>{order.address || '—'}</div>
            </div>
          </div>

          <div className="mt-3">
            <LocationInput lat={order.lat} lng={order.lng} onLocationChange={(lat, lng) => onUpdate(order.id, { lat, lng })} />
          </div>

          <div className="flex-between mt-3">
            <div className="form-label">المنتجات</div>
            <button className="btn btn-sm btn-ghost" onClick={() => setEditItems(!editItems)}>
              {editItems ? '✓ تم' : '✏️ تعديل الأصناف'}
            </button>
          </div>
          {editItems ? (
            <div className="table-wrapper" style={{ maxHeight: 240, overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>المنتج</th>
                    <th style={{ width: '18%', textAlign: 'center' }}>الكمية</th>
                    <th style={{ width: '20%', textAlign: 'left' }}>السعر</th>
                    <th style={{ width: '20%', textAlign: 'left' }}>الإجمالي</th>
                    <th style={{ width: 30 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {itemsForm.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <input className="form-control" style={{ padding: '4px 6px', fontSize: 11 }} value={item.name || item.productName || ''} onChange={e => updateItem(i, 'name', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="quantity-stepper" style={{ display: 'inline-flex' }}>
                          <button onClick={() => updateItem(i, 'quantity', Math.max(0, (item.quantity || 0) - 1))}>−</button>
                          <input type="text" value={item.quantity || 0} readOnly style={{ width: 32, height: 26, fontSize: 11 }} />
                          <button onClick={() => updateItem(i, 'quantity', (item.quantity || 0) + 1)}>+</button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        <input className="form-control" style={{ width: 70, padding: '4px 6px', fontSize: 11, textAlign: 'left' }} type="number" value={item.price || 0} onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td style={{ fontWeight: 600, textAlign: 'left' }}>{(item.price || 0) * (item.quantity || 0)}</td>
                      <td><button className="btn btn-sm btn-ghost" onClick={() => removeItem(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-sm btn-outline w-full mt-2" onClick={addItem}>➕ إضافة صنف</button>
            </div>
          ) : (
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.name || item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price || 0} ج.م</td>
                    <td>{(item.price || 0) * (item.quantity || 0)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex-between mt-4" style={{ fontSize: 18, fontWeight: 700 }}>
            <span>الإجمالي</span>
            <span style={{ color: 'var(--secondary)' }}>{editItems ? itemsTotal : (order.total || 0)} ج.م</span>
          </div>

          {order.deliveryFee > 0 && (
            <div className="flex-between" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span>رسوم التوصيل</span>
              <span>{order.deliveryFee} ج.م</span>
            </div>
          )}

          <div className="grid-2 mt-4">
            <div className="form-group">
              <label className="form-label">الحالة</label>
              <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">قيد الانتظار</option>
                <option value="confirmed">تم التأكيد</option>
                <option value="on-way">في الطريق</option>
                <option value="delivered">تم التوصيل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">السائق</label>
              <select className="form-control" value={driverId} onChange={e => setDriverId(e.target.value)}>
                <option value="">بدون سائق</option>
                {(drivers || []).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
            {order.phone && (
              <>
                <a href={`https://wa.me/${order.phone.replace(/^0/, '20')}?text=${waConfirm(order)}`} target="_blank" className="btn btn-sm btn-outline" title="تأكيد الطلب">📋 تأكيد</a>
                <a href={`https://wa.me/${order.phone.replace(/^0/, '20')}?text=${waOnWay(order)}`} target="_blank" className="btn btn-sm btn-outline" title="السائق في الطريق">🚚 في الطريق</a>
                <a href={`https://wa.me/${order.phone.replace(/^0/, '20')}?text=${waOffer()}`} target="_blank" className="btn btn-sm btn-outline" title="عرض">🎁 عرض</a>
                <a href={`https://wa.me/${order.phone.replace(/^0/, '20')}?text=${waRating(order)}`} target="_blank" className="btn btn-sm btn-outline" title="تقييم">⭐ تقييم</a>
              </>
            )}
            {order.lat && order.lng && (
              <a href={`https://www.google.com/maps?q=${order.lat},${order.lng}`} target="_blank" className="btn btn-sm btn-outline">
                🗺️ خرائط
              </a>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-danger" onClick={() => onDelete(order.id)}>🗑️ حذف</button>
          <button className="btn btn-outline" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
        </div>
      </div>
    </div>
  )
}
