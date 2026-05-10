import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import LocationInput from '../components/LocationInput'

export default function NewOrder() {
  const { products, customers, addOrder, addToast, getDeliveryFee, drivers, settings } = useApp()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState({})
  const [customerSearch, setCustomerSearch] = useState('')
  const [form, setForm] = useState({
    customerName: '', phone: '', zone: '', address: '', notes: '', driverId: '', lat: '', lng: ''
  })
  const [showSuccess, setShowSuccess] = useState(false)

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 5)
    return customers.filter(c =>
      (c.name || c.customerName || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone || '').includes(customerSearch)
    ).slice(0, 5)
  }, [customers, customerSearch])

  const selectCustomer = (c) => {
    setForm({
      ...form,
      customerName: c.name || c.customerName,
      phone: c.phone || '',
      zone: c.zone || '',
      address: c.address || '',
      lat: c.lat || '',
      lng: c.lng || '',
    })
    setCustomerSearch(c.name || c.customerName)
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.category !== 'خدمة' && p.category !== 'خدمات')
  }, [products])

  const toggleProduct = (product) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[product.id]) {
        delete next[product.id]
      } else {
        next[product.id] = { ...product, quantity: 1 }
      }
      return next
    })
  }

  const updateQty = (id, qty) => {
    if (qty < 0) return
    setSelected(prev => {
      const next = { ...prev }
      if (qty === 0) { delete next[id]; return next }
      next[id] = { ...next[id], quantity: qty }
      return next
    })
  }

  const orderItems = Object.values(selected)
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
  const deliveryFee = getDeliveryFee(subtotal)
  const total = subtotal + deliveryFee

  const handleSubmit = () => {
    const order = {
      ...form,
      items: orderItems.map(item => ({
        productId: item.id,
        name: item.name || item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal,
      deliveryFee,
      total,
      status: 'pending',
      driverId: form.driverId || undefined,
    }
    addOrder(order)
    setShowSuccess(true)
    addToast('✅ تم إنشاء الطلب بنجاح!', 'success')
    setTimeout(() => {
      setShowSuccess(false)
      setStep(0)
      setSelected({})
      setForm({ customerName: '', phone: '', zone: '', address: '', notes: '', driverId: '', lat: '', lng: '' })
    }, 2000)
  }

  const canNext = step === 0 ? orderItems.length > 0 : step === 1 ? form.customerName && form.zone : true

  if (showSuccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 72, animation: 'checkmark 0.5s ease' }}>✅</div>
        <h2 style={{ fontSize: 28, marginTop: 16, color: 'var(--success)' }}>تم إنشاء الطلب بنجاح!</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>جاري تحويلك...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">طلب جديد</h1>
          <p className="page-subtitle">إنشاء طلب توصيل جديد</p>
        </div>
      </div>

      <div className="stepper">
        <div className={`step ${step === 0 ? 'active' : ''} ${step > 0 ? 'completed' : ''}`}>
          <div className="step-number">{step > 0 ? '✓' : '1'}</div>
          <span className="step-label">المنتجات</span>
        </div>
        <div className={`step-line ${step > 0 ? 'completed' : ''}`} />
        <div className={`step ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">{step > 1 ? '✓' : '2'}</div>
          <span className="step-label">العميل</span>
        </div>
        <div className={`step-line ${step > 1 ? 'completed' : ''}`} />
        <div className={`step ${step === 2 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span className="step-label">مراجعة</span>
        </div>
      </div>

      {step === 0 && (
        <div>
          <div className="flex-between mb-3">
            <h2 className="card-title">اختر المنتجات</h2>
            <span className="text-sm text-muted">{orderItems.length} منتج</span>
          </div>
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className={`product-card${selected[product.id] ? ' selected' : ''}`}
                onClick={() => toggleProduct(product)}
              >
                <div className="product-img">
                  {product.image || '🥬'}
                </div>
                <div className="product-name">{product.name || product.productName}</div>
                <div className="product-price">{product.price || 0} ج.م</div>
                <div className="product-unit">{product.unit || ''}</div>
                {selected[product.id] && (
                  <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                    <div className="quantity-stepper">
                      <button onClick={() => updateQty(product.id, (selected[product.id]?.quantity || 0) - 1)}>−</button>
                      <input type="text" value={selected[product.id]?.quantity || 0} readOnly />
                      <button onClick={() => updateQty(product.id, (selected[product.id]?.quantity || 0) + 1)}>+</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="card-title mb-3">بيانات العميل</h2>
          <div className="form-group">
            <label className="form-label">اسم العميل</label>
            <input
              className="form-control"
              placeholder="ابحث أو اكتب اسم العميل..."
              value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setForm({ ...form, customerName: e.target.value }) }}
            />
            {customerSearch && filteredCustomers.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: 2 }}>
                {filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}
                    onClick={() => selectCustomer(c)}
                  >
                    <strong>{c.name || c.customerName}</strong> — {c.phone || ''}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">رقم الهاتف</label>
              <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="010..." />
            </div>
            <div className="form-group">
              <label className="form-label">المنطقة</label>
              <input className="form-control" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="اسم المنطقة" />
            </div>
          </div>
            <div className="form-group">
              <label className="form-label">العنوان</label>
              <input className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="العنوان بالتفصيل" />
            </div>
            <LocationInput lat={form.lat} lng={form.lng} onLocationChange={(lat, lng) => setForm({ ...form, lat, lng })} />
          <div className="form-group">
            <label className="form-label">السائق</label>
            <select className="form-control" value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>
              <option value="">بدون سائق</option>
              {(drivers || []).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">ملاحظات</label>
            <textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="أي ملاحظات للطلب" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid-2">
          <div>
            <div className="card">
              <h3 className="card-title mb-3">المنتجات المختارة</h3>
              {orderItems.map((item, i) => (
                <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>{item.name || item.productName} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{(item.price || 0) * item.quantity} ج.م</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="card" style={{ position: 'sticky', top: 88 }}>
              <h3 className="card-title mb-3">ملخص الطلب</h3>
              <div className="flex-between mb-2"><span className="text-muted">العميل</span><span style={{ fontWeight: 600 }}>{form.customerName}</span></div>
              <div className="flex-between mb-2"><span className="text-muted">المنطقة</span><span>{form.zone}</span></div>
              <div className="flex-between mb-2"><span className="text-muted">الهاتف</span><span>{form.phone || '—'}</span></div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
              <div className="flex-between mb-2"><span>المجموع الفرعي</span><span>{subtotal} ج.م</span></div>
              <div className="flex-between mb-2">
                <span>التوصيل</span>
                <span style={{ color: deliveryFee === 0 ? 'var(--success)' : undefined }}>
                  {deliveryFee === 0 ? 'مجانًا' : `${deliveryFee} ج.م`}
                </span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
              <div className="flex-between" style={{ fontSize: 20, fontWeight: 800 }}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--secondary)' }}>{total} ج.م</span>
              </div>
              {form.notes && (
                <div className="mt-3">
                  <div className="text-muted text-sm">ملاحظات:</div>
                  <div style={{ fontSize: 13 }}>{form.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-between mt-4">
        <div>
          {step > 0 && (
            <button className="btn btn-outline" onClick={() => setStep(step - 1)}>→ السابق</button>
          )}
        </div>
        {step < 2 ? (
          <button className="btn btn-primary btn-lg" disabled={!canNext} onClick={() => setStep(step + 1)}>
            التالي ←
          </button>
        ) : (
          <button className="btn btn-success btn-lg" onClick={handleSubmit}>
            ✅ تأكيد الطلب
          </button>
        )}
      </div>
    </div>
  )
}
