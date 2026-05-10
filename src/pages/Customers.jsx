import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import DataTable from '../components/DataTable'

export default function Customers() {
  const { customers, orders, addCustomer, updateCustomer, deleteCustomer, isVIP, addToast } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', zone: '', address: '', lat: '', lng: '' })

  const openNew = () => {
    setEditCustomer(null)
    setForm({ name: '', phone: '', zone: '', address: '', lat: '', lng: '' })
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditCustomer(c)
    setForm({
      name: c.name || c.customerName || '',
      phone: c.phone || '',
      zone: c.zone || '',
      address: c.address || '',
      lat: c.lat || '',
      lng: c.lng || '',
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name) { addToast('الرجاء إدخال اسم العميل', 'warning'); return }
    const data = { name: form.name, customerName: form.name, phone: form.phone, zone: form.zone, address: form.address, lat: form.lat, lng: form.lng }
    if (editCustomer) {
      updateCustomer(editCustomer.id, data)
      addToast('تم تحديث العميل', 'success')
    } else {
      addCustomer(data)
      addToast('تم إضافة العميل', 'success')
    }
    setShowForm(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('حذف هذا العميل؟')) {
      deleteCustomer(id)
      addToast('تم حذف العميل', 'success')
    }
  }

  const customersWithStats = customers.map(c => {
    const customerOrders = orders.filter(o => o.customerId === c.id || o.customerName === (c.name || c.customerName))
    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    return {
      ...c,
      name: c.name || c.customerName,
      orderCount: customerOrders.length,
      totalSpent,
      vip: customerOrders.length >= 3 || totalSpent >= 500
    }
  })

  const columns = [
    { key: 'name', label: 'الاسم', render: r => (
      <div className="flex-center gap-2">
        <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
          {r.name?.[0] || '?'}
        </div>
        <div>
          <span style={{ fontWeight: 600 }}>{r.name}</span>
          {r.vip && <span className="badge badge-warning" style={{ marginRight: 6 }}>⭐ VIP</span>}
        </div>
      </div>
    )},
    { key: 'phone', label: 'الهاتف' },
    { key: 'zone', label: 'المنطقة' },
    { key: 'orderCount', label: 'الطلبات', render: r => r.orderCount },
    { key: 'totalSpent', label: 'الإجمالي', render: r => `${r.totalSpent.toLocaleString()} ج.م` },
    { key: 'actions', label: '', sortable: false, render: r => (
      <div className="flex gap-2">
        <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); openEdit(r) }}>✏️</button>
        <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }}>🗑️</button>
      </div>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">العملاء</h1>
          <p className="page-subtitle">إدارة قاعدة العملاء</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>➕ إضافة عميل</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={customersWithStats}
          emptyMessage="لا توجد عملاء"
          emptyIcon="👥"
          onRowClick={(r) => openEdit(r)}
        />
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editCustomer ? 'تعديل عميل' : 'إضافة عميل'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اسم العميل</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">رقم الهاتف</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">المنطقة</label>
                  <input className="form-control" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">العنوان</label>
                <textarea className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Lat</label>
                  <input className="form-control" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Lng</label>
                  <input className="form-control" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
