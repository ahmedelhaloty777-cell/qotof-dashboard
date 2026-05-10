import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import DataTable from '../components/DataTable'

export default function Purchase() {
  const { orders, products, suppliers, addSupplier, updateSupplier, deleteSupplier, addToast } = useApp()
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '' })

  const todayOrders = useMemo(() =>
    orders.filter(o => {
      const today = new Date().toISOString().split('T')[0]
      return o.createdAt?.startsWith(today) && o.status !== 'cancelled'
    }),
    [orders]
  )

  const purchaseItems = useMemo(() => {
    const itemMap = {}
    todayOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.name || item.productName
        if (key) {
          itemMap[key] = (itemMap[key] || 0) + (item.quantity || 0)
        }
      })
    })
    return Object.entries(itemMap).map(([name, qty]) => {
      const product = products.find(p => (p.name || p.productName) === name)
      return { name, quantity: qty, price: product?.sellPrice || product?.price || 0, total: (product?.sellPrice || product?.price || 0) * qty }
    })
  }, [todayOrders, products])

  const totalPurchase = purchaseItems.reduce((s, i) => s + i.total, 0)
  const totalCost = purchaseItems.reduce((s, i) => {
    const product = products.find(p => (p.name || p.productName) === i.name)
    return s + (product?.costPrice || 0) * i.quantity
  }, 0)

  const messageText = encodeURIComponent(
    'مرحباً، نود طلب الأصناف التالية:\n' +
    purchaseItems.map(i => `- ${i.name}: ${i.quantity} كجم`).join('\n') +
    `\n\nالإجمالي: ${totalPurchase.toLocaleString()} ج.م`
  )

  const openNewSupplier = () => {
    setEditSupplier(null)
    setSupplierForm({ name: '', phone: '', email: '' })
    setShowSupplierForm(true)
  }

  const openEditSupplier = (s) => {
    setEditSupplier(s)
    setSupplierForm({ name: s.name, phone: s.phone || '', email: s.email || '' })
    setShowSupplierForm(true)
  }

  const handleSaveSupplier = () => {
    if (!supplierForm.name) { addToast('الرجاء إدخال اسم المورد', 'warning'); return }
    if (editSupplier) {
      updateSupplier(editSupplier.id, supplierForm)
      addToast('تم تحديث المورد', 'success')
    } else {
      addSupplier(supplierForm)
      addToast('تم إضافة المورد', 'success')
    }
    setShowSupplierForm(false)
  }

  const columns = [
    { key: 'name', label: 'المنتج' },
    { key: 'quantity', label: 'الكمية', render: r => r.quantity },
    { key: 'price', label: 'سعر البيع', render: r => `${r.price.toFixed(0)} ج.م` },
    { key: 'total', label: 'الإجمالي', render: r => `${r.total.toFixed(0)} ج.م` },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">المشتريات</h1>
          <p className="page-subtitle">إدارة أوامر الشراء للموردين</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={openNewSupplier}>➕ إضافة مورد</button>
          {suppliers?.length > 0 && purchaseItems.length > 0 && (
            <a
              href={`https://wa.me/${suppliers[0].phone.replace(/^0/, '20')}?text=${messageText}`}
              target="_blank"
              className="btn btn-success"
            >
              💬 أرسل الكل عبر واتساب
            </a>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h2 className="card-title">مشتريات اليوم — بناءً على طلبات العملاء</h2>
          <span className="badge badge-info">{todayOrders.length} طلب</span>
        </div>
        <DataTable
          columns={columns}
          data={purchaseItems}
          emptyMessage="لا توجد طلبات اليوم لإنشاء مشتريات"
          emptyIcon="📭"
        />
        {purchaseItems.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', textAlign: 'left' }}>
            <div className="flex-between">
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>التكلفة التقديرية</span>
              <span style={{ fontWeight: 600 }}>{totalCost.toLocaleString()} ج.م</span>
            </div>
            <div className="flex-between" style={{ marginTop: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>سعر البيع الإجمالي</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--secondary)' }}>{totalPurchase.toLocaleString()} ج.م</span>
            </div>
            <div className="flex-between" style={{ marginTop: 4 }}>
              <span style={{ fontSize: 13 }}>الربح المتوقع</span>
              <span style={{ fontWeight: 700, color: totalPurchase - totalCost >= 0 ? 'var(--success)' : 'var(--error)' }}>
                {(totalPurchase - totalCost).toLocaleString()} ج.م
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">الموردون</h3>
          <button className="btn btn-sm btn-primary" onClick={openNewSupplier}>➕ إضافة</button>
        </div>
        {(!suppliers || suppliers.length === 0) ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏭</div>
            <div className="empty-state-text">لا توجد موردين</div>
            <div className="empty-state-sub">أضف مورداً لإرسال أوامر الشراء عبر واتساب</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم المورد</th>
                  <th>رقم الهاتف</th>
                  <th>البريد الإلكتروني</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.phone || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        {s.phone && (
                          <a href={`https://wa.me/${s.phone.replace(/^0/, '20')}?text=${messageText}`} target="_blank" className="btn btn-sm btn-ghost">💬</a>
                        )}
                        <button className="btn btn-sm btn-ghost" onClick={() => openEditSupplier(s)}>✏️</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => { if (window.confirm('حذف المورد؟')) { deleteSupplier(s.id); addToast('تم الحذف', 'success') } }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSupplierForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowSupplierForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editSupplier ? 'تعديل مورد' : 'إضافة مورد'}</h2>
              <button className="modal-close" onClick={() => setShowSupplierForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اسم المورد</label>
                <input className="form-control" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">رقم الهاتف</label>
                  <input className="form-control" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="010..." />
                </div>
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input className="form-control" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                </div>
              </div>
              {supplierForm.phone && purchaseItems.length > 0 && (
                <a
                  href={`https://wa.me/${supplierForm.phone.replace(/^0/, '20')}?text=${messageText}`}
                  target="_blank"
                  className="btn btn-success w-full mt-3"
                >
                  💬 إرسال الطلب عبر واتساب
                </a>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowSupplierForm(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={handleSaveSupplier}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
