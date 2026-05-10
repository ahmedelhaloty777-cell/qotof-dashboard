import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import StatusBadge from '../components/StatusBadge'

export default function Invoices() {
  const { orders, invoices, settings, addInvoice, deleteInvoice, addToast } = useApp()
  const [selectedOrder, setSelectedOrder] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState([])
  const fileInputRef = useRef(null)

  const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'confirmed')

  const startCreate = () => {
    setSelectedOrder('')
    setInvoiceItems([])
    setShowCreate(true)
  }

  const selectOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(orderId)
      setInvoiceItems((order.items || []).map(item => ({
        name: item.name || item.productName,
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: (item.price || 0) * (item.quantity || 1)
      })))
    }
  }

  const handleCreateInvoice = () => {
    if (invoiceItems.length === 0) { addToast('الفاتورة فارغة', 'warning'); return }
    const order = orders.find(o => o.id === selectedOrder)
    const total = invoiceItems.reduce((s, i) => s + i.total, 0)
    addInvoice({
      orderId: selectedOrder || '',
      customerName: order?.customerName || 'نقدي',
      phone: order?.phone || '',
      zone: order?.zone || '',
      date: new Date().toISOString(),
      items: invoiceItems.map(i => ({ ...i })),
      total
    })
    addToast('✅ تم حفظ الفاتورة', 'success')
    setShowCreate(false)
  }

  const updateItem = (idx, field, value) => {
    setInvoiceItems(prev => {
      const items = [...prev]
      items[idx] = { ...items[idx], [field]: value }
      items[idx].total = (items[idx].price || 0) * (items[idx].quantity || 0)
      return items
    })
  }

  const addItem = () => {
    setInvoiceItems(prev => [...prev, { name: '', quantity: 1, price: 0, total: 0 }])
  }

  const removeItem = (idx) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== idx))
  }

  const invoiceTotal = invoiceItems.reduce((s, i) => s + i.total, 0)

  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        const items = []
        rows.forEach((row, idx) => {
          if (idx === 0) return
          const [name, qty, price] = row
          if (!name) return
          items.push({
            name: String(name).trim(),
            quantity: parseFloat(qty) || 1,
            price: parseFloat(price) || 0,
            total: (parseFloat(price) || 0) * (parseFloat(qty) || 1)
          })
        })
        if (items.length === 0) { addToast('لم يتم العثور على أصناف', 'warning'); return }
        setInvoiceItems(items)
        addToast(`✅ تم استيراد ${items.length} صنف`, 'success')
      } catch { addToast('❌ فشل قراءة الملف', 'error') }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank')
    const itemsHtml = invoice.items.map(i =>
      `<tr><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${i.name}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:left">${i.price.toFixed(0)} ج.م</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:left">${i.total.toFixed(0)} ج.م</td></tr>`
    ).join('')

    const qrTelegram = settings?.qrTelegram || 'https://t.me/qotof'
    const qrFacebook = settings?.qrFacebook || 'https://facebook.com/qotof'

    printWindow.document.write(`
      <html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة قطوف</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Cairo',sans-serif;padding:40px;color:#1a1a2e}
        .header{text-align:center;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #1F3D2B}
        .header h1{font-size:28px;color:#1F3D2B;margin-bottom:4px}
        .header .sub{color:#7BAA4D;font-size:14px}
        .info{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;color:#6b7280}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        th{background:#1F3D2B;color:white;padding:10px 12px;font-size:13px;text-align:right}
        td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
        tfoot td{font-weight:700;font-size:16px;border-top:2px solid #1F3D2B}
        .message{background:#F5F7F2;padding:16px 20px;border-radius:12px;margin:20px 0;font-size:13px;line-height:1.8;color:#1F3D2B;text-align:justify}
        .qr-section{display:flex;justify-content:center;gap:32px;margin:20px 0}
        .qr-item{text-align:center}
        .qr-item img{width:90px;height:90px;border-radius:8px}
        .qr-item div{font-size:11px;color:#6b7280;margin-top:4px}
        .footer{text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af}
        @media print{body{padding:20px}.no-print{display:none}}
      </style></head><body>
      <div class="header">
        <h1>قطوف</h1>
        <div class="sub">لتوصيل الخضروات والفواكه الطازجة</div>
      </div>
      <div class="info">
        <div><strong>العميل:</strong> ${invoice.customerName || 'نقدي'}</div>
        <div><strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleDateString('ar-EG')}</div>
        <div><strong>رقم الفاتورة:</strong> #${(invoice.id || '').slice(-8)}</div>
      </div>
      <table><thead><tr><th>الصنف</th><th style="text-align:center">الكمية</th><th style="text-align:left">السعر</th><th style="text-align:left">الإجمالي</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr><td colspan="3" style="text-align:left">الإجمالي</td><td style="text-align:left">${invoice.total.toFixed(0)} ج.م</td></tr></tfoot></table>
      ${invoice.notes ? `<p style="margin-bottom:16px;font-size:13px;color:#6b7280"><strong>ملاحظات:</strong> ${invoice.notes}</p>` : ''}
      <div class="message">
        أهلاً بيكي في أسرة قُطوف. إحنا مبسوطين جداً إنك إخترتينا. مجهود كبير قوي إتبذل عشان نوصّلك الخضار والفاكهة بالجودة دي، وبأسعار تنافسية، وكمان توصيل مجاني. لو تجربتك معانا عجبتك، يا ريت تشاركي فكرتنا مع حبايبك وجيرانك علشان هما كمان يطلبوا مننا، مساهمتك في نشر فكرتنا هي اللي هتساعدنا نستمر ونكبر. استخدمي الـ QR كود للاشتراك في جروب تليجرام وكمان الفيسبوك ومشاركته مع كل حبايبك. شكراً لثقتك وبالهنا.
      </div>
      <div class="qr-section">
        <div class="qr-item">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrTelegram)}" alt="تيليجرام" />
          <div>تيليجرام</div>
        </div>
        <div class="qr-item">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrFacebook)}" alt="فيسبوك" />
          <div>فيسبوك</div>
        </div>
      </div>
      <div class="footer">شكراً لثقتك وبالهنا 🌿</div>
      <button class="no-print" onclick="window.print()" style="margin-top:16px;padding:10px 24px;background:#1F3D2B;color:white;border:none;border-radius:8px;cursor:pointer;font-family:'Cairo'">🖨️ طباعة</button>
      </body></html>
    `)
    printWindow.document.close()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📄 الفواتير</h1>
          <p className="page-subtitle">حفظ وطباعة الفواتير بأسعار ثابتة</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleExcelUpload} />
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>📊 رفع Excel</button>
          <button className="btn btn-primary" onClick={startCreate}>📄 فاتورة جديدة</button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">لا توجد فواتير محفوظة</div>
            <div className="empty-state-sub">أنشئ فاتورة جديدة من الطلبات المكتملة</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>العميل</th>
                <th>التاريخ</th>
                <th>الأصناف</th>
                <th>الإجمالي</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>#{inv.id?.slice(-8)}</td>
                  <td style={{ fontWeight: 600 }}>{inv.customerName || 'نقدي'}</td>
                  <td>{new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                  <td>{inv.items?.length || 0} صنف</td>
                  <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>{inv.total.toLocaleString()} ج.م</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-outline" onClick={() => printInvoice(inv)}>🖨️</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => { if (window.confirm('حذف الفاتورة؟')) { deleteInvoice(inv.id); addToast('تم الحذف', 'success') } }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 className="modal-title">فاتورة جديدة</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اختيار من طلب موجود (أسعار الطلب وقتها)</label>
                <select className="form-control" value={selectedOrder} onChange={e => selectOrder(e.target.value)}>
                  <option value="">— بدون طلب (إدخال يدوي) —</option>
                  {deliveredOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.id?.slice(-6)} — {o.customerName} — {o.total} ج.م ({new Date(o.createdAt).toLocaleDateString('ar-EG')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-between mb-2">
                <label className="form-label" style={{ margin: 0 }}>الأصناف (تعديل الأسعار لا يؤثر على الطلب الأصلي)</label>
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-ghost" onClick={() => fileInputRef.current?.click()}>📊</button>
                  <button className="btn btn-sm btn-outline" onClick={addItem}>➕ إضافة</button>
                </div>
              </div>

              <div className="table-wrapper" style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>الصنف</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>الكمية</th>
                      <th style={{ width: '20%', textAlign: 'left' }}>السعر</th>
                      <th style={{ width: '20%', textAlign: 'left' }}>الإجمالي</th>
                      <th style={{ width: 30 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item, i) => (
                      <tr key={i}>
                        <td><input className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} /></td>
                        <td><input className="form-control" style={{ width: 60, padding: '4px 8px', fontSize: 12, textAlign: 'center' }} type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                        <td><input className="form-control" style={{ width: 80, padding: '4px 8px', fontSize: 12, textAlign: 'left' }} type="number" value={item.price} onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)} /></td>
                        <td style={{ fontWeight: 600, textAlign: 'left' }}>{item.total.toFixed(0)}</td>
                        <td><button className="btn btn-sm btn-ghost" onClick={() => removeItem(i)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-between mt-3" style={{ fontSize: 18, fontWeight: 800 }}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--secondary)' }}>{invoiceTotal.toFixed(0)} ج.م</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={handleCreateInvoice}>💾 حفظ الفاتورة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
