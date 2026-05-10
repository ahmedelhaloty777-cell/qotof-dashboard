import React from 'react'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { settings, drivers, orders, products, customers, expenses, suppliers, invoices, saveState, addDriver, updateDriver, deleteDriver, dispatch, addToast } = useApp()
  const [showDriverForm, setShowDriverForm] = React.useState(false)
  const [driverForm, setDriverForm] = React.useState({ name: '', phone: '' })
  const [editDriver, setEditDriver] = React.useState(null)

  const handleSetting = (key, value) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } })
    addToast('تم حفظ الإعدادات', 'success')
  }

  const openDriverForm = (driver) => {
    if (driver) {
      setEditDriver(driver)
      setDriverForm({ name: driver.name, phone: driver.phone || '' })
    } else {
      setEditDriver(null)
      setDriverForm({ name: '', phone: '' })
    }
    setShowDriverForm(true)
  }

  const handleSaveDriver = () => {
    if (!driverForm.name) { addToast('الرجاء إدخال اسم السائق', 'warning'); return }
    if (editDriver) {
      updateDriver(editDriver.id, driverForm)
      addToast('تم تحديث السائق', 'success')
    } else {
      addDriver(driverForm)
      addToast('تم إضافة السائق', 'success')
    }
    setShowDriverForm(false)
  }

  const handleDeleteDriver = (id) => {
    if (window.confirm('حذف السائق؟')) {
      deleteDriver(id)
      addToast('تم الحذف', 'success')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ الإعدادات</h1>
          <p className="page-subtitle">إعدادات النظام</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title mb-3">إعدادات التوصيل</h3>
          <div className="form-group">
            <label className="form-label">قيمة التوصيل (ج.م)</label>
            <input className="form-control" type="number" value={settings.deliveryFee || 15} onChange={e => handleSetting('deliveryFee', parseFloat(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">الحد الأدنى للشحن المجاني (ج.م)</label>
            <input className="form-control" type="number" value={settings.threshold || 300} onChange={e => handleSetting('threshold', parseFloat(e.target.value))} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            الطلبات فوق {settings.threshold || 300} ج.م توصيل مجاني
          </div>
        </div>

        <div className="card">
          <h3 className="card-title mb-3">روابط QR للفواتير</h3>
          <div className="form-group">
            <label className="form-label">رابط تيليجرام</label>
            <input className="form-control" value={settings.qrTelegram || ''} onChange={e => handleSetting('qrTelegram', e.target.value)} placeholder="https://t.me/..." />
          </div>
          <div className="form-group">
            <label className="form-label">رابط فيسبوك</label>
            <input className="form-control" value={settings.qrFacebook || ''} onChange={e => handleSetting('qrFacebook', e.target.value)} placeholder="https://facebook.com/..." />
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="card-title mb-3">مظهر</h3>
        <div className="form-group">
          <label className="form-label">حجم الخط</label>
          <div className="flex-center gap-3">
            <span className="text-sm">صغير</span>
            <input type="range" min="80" max="150" value={settings.fontScale || 100}
              onChange={e => { const val = parseInt(e.target.value); handleSetting('fontScale', val); document.documentElement.style.fontSize = `${(val / 100) * 15}px` }}
              style={{ flex: 1, accentColor: 'var(--secondary)' }} />
            <span className="text-sm">كبير</span>
            <span style={{ fontWeight: 600 }}>{settings.fontScale || 100}%</span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">الوضع</label>
          <div className="flex gap-2">
            <button className={`btn btn-sm ${settings.theme === 'light' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { dispatch({ type: 'SET_THEME' }) }}>☀️ فاتح</button>
            <button className={`btn btn-sm ${settings.theme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { if (settings.theme !== 'dark') dispatch({ type: 'SET_THEME' }) }}>🌙 داكن</button>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">السائقون</h3>
          <button className="btn btn-sm btn-primary" onClick={() => openDriverForm(null)}>➕ إضافة سائق</button>
        </div>
        {drivers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚚</div>
            <div className="empty-state-text">لا توجد سائقين</div>
            <div className="empty-state-sub">أضف سائقاً لتعيينه على الطلبات</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>الاسم</th><th>رقم الهاتف</th><th style={{ width: 100 }}></th></tr></thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.phone || '—'}</td>
                    <td><div className="flex gap-2">
                      <button className="btn btn-sm btn-ghost" onClick={() => openDriverForm(d)}>✏️</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleDeleteDriver(d.id)}>🗑️</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">💾 تصدير / استيراد البيانات</h3>
        </div>
        <div className="flex gap-3" style={{ padding: 16 }}>
          <div style={{ flex: 1 }}>
            <p className="text-sm text-muted mb-2">تصدير نسخة احتياطية من كل البيانات</p>
            <button className="btn btn-primary" onClick={() => {
              const data = { orders, products, customers, expenses, drivers, suppliers, invoices, settings, exportedAt: new Date().toISOString() }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `qotof-backup-${new Date().toISOString().split('T')[0]}.json`
              a.click(); URL.revokeObjectURL(url)
              addToast('✅ تم تصدير البيانات', 'success')
            }}>
              ⬇️ تصدير البيانات
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <p className="text-sm text-muted mb-2">استيراد بيانات من ملف نسخة احتياطية</p>
            <label className="btn btn-outline" style={{ display: 'inline-block', cursor: 'pointer' }}>
              📂 استيراد بيانات
              <input type="file" accept=".json" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target.result)
                      const keys = ['orders', 'products', 'customers', 'expenses', 'drivers', 'suppliers', 'invoices', 'settings']
                      let count = 0
                      keys.forEach(k => { if (data[k] !== undefined) { saveState(k, data[k]); count++ } })
                      addToast(`✅ تم استيراد ${count} أقسام بنجاح`, 'success')
                    } catch { addToast('❌ ملف غير صالح', 'error') }
                  }
                  reader.readAsText(file)
                  e.target.value = ''
                }} />
            </label>
          </div>
        </div>
      </div>

      {showDriverForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDriverForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editDriver ? 'تعديل سائق' : 'إضافة سائق'}</h2>
              <button className="modal-close" onClick={() => setShowDriverForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اسم السائق</label>
                <input className="form-control" value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">رقم الهاتف</label>
                <input className="form-control" value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDriverForm(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={handleSaveDriver}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
