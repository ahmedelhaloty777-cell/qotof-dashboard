import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import DataTable from '../components/DataTable'

export default function Products() {
  const { products, addProduct, bulkAddProducts, updateProduct, deleteProduct, addToast } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({ name: '', sellPrice: '', costPrice: '', unit: '', category: '' })
  const fileInputRef = useRef(null)

  const openNew = () => {
    setEditProduct(null)
    setForm({ name: '', sellPrice: '', costPrice: '', unit: '', category: '' })
    setShowForm(true)
  }

  const openEdit = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name || product.productName || '',
      sellPrice: product.sellPrice || product.price || '',
      costPrice: product.costPrice || '',
      unit: product.unit || '',
      category: product.category || ''
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name || !form.sellPrice) {
      addToast('الرجاء إدخال اسم المنتج وسعر البيع', 'warning')
      return
    }
    const data = {
      name: form.name,
      productName: form.name,
      sellPrice: parseFloat(form.sellPrice) || 0,
      price: parseFloat(form.sellPrice) || 0,
      costPrice: parseFloat(form.costPrice) || 0,
      unit: form.unit,
      category: form.category,
      profit: (parseFloat(form.sellPrice) || 0) - (parseFloat(form.costPrice) || 0),
      margin: (parseFloat(form.sellPrice) || 0) > 0
        ? Math.round((((parseFloat(form.sellPrice) || 0) - (parseFloat(form.costPrice) || 0)) / (parseFloat(form.sellPrice) || 0)) * 100)
        : 0
    }
    if (editProduct) {
      updateProduct(editProduct.id, data)
      addToast('تم تحديث المنتج', 'success')
    } else {
      addProduct(data)
      addToast('تم إضافة المنتج', 'success')
    }
    setShowForm(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('حذف هذا المنتج؟')) {
      deleteProduct(id)
      addToast('تم حذف المنتج', 'success')
    }
  }

  const handleDeleteAll = () => {
    if (window.confirm('⚠️ هل أنت متأكد من حذف ALL المنتجات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      if (window.prompt('اكتب "تأكيد" لحذف الكل') === 'تأكيد') {
        products.forEach(p => deleteProduct(p.id))
        addToast(`✅ تم حذف ${products.length} منتج`, 'success')
      }
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      handlePdfUpload(file)
    } else {
      handleExcelUpload(file)
    }
    e.target.value = ''
  }

  const handleExcelUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        const parsed = parseRows(rows)
        if (parsed.length === 0) { addToast('لم يتم العثور على منتجات', 'warning'); return }
        bulkAddProducts(parsed)
        addToast(`✅ تم استيراد ${parsed.length} منتج من Excel`, 'success')
      } catch (err) {
        addToast('❌ فشل قراءة ملف Excel', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handlePdfUpload = async (file) => {
    try {
      addToast('📄 جاري قراءة PDF...', 'info', 2000)
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map(item => item.str).join(' ') + '\n'
      }

      const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      const expandedLines = []
      lines.forEach(line => {
        if (line.length > 80 && /\d+\s+[A-Za-z\u0600-\u06FF]/.test(line)) {
          const parts = line.split(/(?=\b\d+\s+[A-Za-z\u0600-\u06FF])/).filter(p => p.trim().length > 0)
          if (parts.length > 1) { expandedLines.push(...parts); return }
        }
        expandedLines.push(line)
      })
      const parsed = parsePdfLines(expandedLines)

      if (parsed.length === 0) {
        addToast(`لم يتم التعرف على منتجات. النص المستخرج:\n${fullText.slice(0, 500)}...\n\nحاول تحويل الملف لـ Excel أو أضف المنتجات يدوياً`, 'warning', 10000)
        return
      }

      bulkAddProducts(parsed)
      addToast(`✅ تم استيراد ${parsed.length} منتج من PDF\n${parsed.map(p => `- ${p.name}: ${p.price} ج.م`).join('\n')}`, 'success', 8000)
    } catch (err) {
      addToast(`❌ فشل قراءة PDF: ${err.message}`, 'error')
    }
  }

  function parseRows(rows) {
    const parsed = []
    rows.forEach((row, idx) => {
      if (idx === 0) return
      const [name, sellPrice, costPrice, unit, category] = row
      if (!name || !sellPrice) return
      const sp = parseFloat(sellPrice) || 0
      const cp = parseFloat(costPrice) || 0
      parsed.push({
        name: String(name).trim(),
        productName: String(name).trim(),
        sellPrice: sp, price: sp, costPrice: cp,
        unit: String(unit || '').trim(),
        category: String(category || '').trim(),
        profit: sp - cp,
        margin: sp > 0 ? Math.round(((sp - cp) / sp) * 100) : 0
      })
    })
    return parsed
  }

  function parsePdfLines(lines) {
    const results = []
    const ignoredWords = ['price', 'list', 'kg', 'egp', 'product', 'code', 'total', 'vat', 'date', 'page', 'you farm', 'invoice', 'tel', 'fax', 'email', 'mobile', 'www', '.com', 'supplier', 'فاتورة', 'مورد', 'تاريخ', 'سعر', 'إجمالي', 'كجم', 'المنتج', 'الصنف']

    lines.forEach(line => {
      const clean = line.replace(/[,\s]+/g, ' ').trim()
      if (clean.length < 3) return
      if (ignoredWords.some(w => clean.toLowerCase().includes(w))) return
      if (/^[\d\s.\-/]+$/.test(clean)) return

      const pricePatterns = [
        { regex: /^(\d+)\s+(.+?)\s+(\d+[.]?\d*)\s+/, nameIdx: 2, priceIdx: 3 },
        { regex: /^(\d+)\s+(.+?)\s+(\d+[.]?\d*)$/, nameIdx: 2, priceIdx: 3 },
        { regex: /(.+?)\s+(\d+[.]?\d*)\s*[×xX*]\s*(\d+[.]?\d*)\s*(EGP|ج\.م|LE)?$/i, nameIdx: 1, priceIdx: 2 },
        { regex: /(.+?)\s+(\d+[.]?\d*)\s*(EGP|ج\.م|LE)?\s*\/?\s*(kg|كجم|kilo|حبة)?$/i, nameIdx: 1, priceIdx: 2 },
        { regex: /(\d+[.]?\d*)\s*[×xX*]\s*(\d+[.]?\d*)\s+(.+)/i, nameIdx: 3, priceIdx: 2 },
        { regex: /(.+?)\s+[-–—]\s+(\d+[.]?\d*)/, nameIdx: 1, priceIdx: 2 },
        { regex: /(\d+)\s*[-.)]\s*(.+?)\s+(\d+[.]?\d*)/, nameIdx: 2, priceIdx: 3 },
      ]

      for (const p of pricePatterns) {
        const match = clean.match(p.regex)
        if (match) {
          let name = match[p.nameIdx]?.trim()
          const price = parseFloat(match[p.priceIdx])
          name = name?.replace(/^[\d\s.\-/)]+/, '').trim()
          name = name?.replace(/\s+\d+$/, '').trim()
          if (name && name.length > 1 && price > 0 && !results.find(r => r.name === name)) {
            results.push({
              name, productName: name,
              sellPrice: price, price,
              costPrice: Math.round(price * 0.6),
              unit: 'كجم', category: '',
              profit: price - Math.round(price * 0.6),
              margin: 40
            })
          }
          break
        }
      }
    })
    return results
  }

  const productsWithProfit = products.map(p => ({
    ...p,
    name: p.name || p.productName,
    profit: (p.sellPrice || p.price || 0) - (p.costPrice || 0),
    margin: (p.sellPrice || p.price || 0) > 0
      ? Math.round((((p.sellPrice || p.price || 0) - (p.costPrice || 0)) / (p.sellPrice || p.price || 0)) * 100)
      : 0
  }))

  const columns = [
    { key: 'name', label: 'المنتج', render: r => (
      <div className="flex-center gap-2">
        <span style={{ fontSize: 24 }}>{r.image || '🥬'}</span>
        <span style={{ fontWeight: 600 }}>{r.name}</span>
      </div>
    )},
    { key: 'costPrice', label: 'التكلفة', render: r => `${(r.costPrice || 0).toFixed(0)} ج.م` },
    { key: 'sellPrice', label: 'البيع', render: r => (
      <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{(r.sellPrice || r.price || 0).toFixed(0)} ج.م</span>
    )},
    { key: 'profit', label: 'الربح', render: r => {
      const profit = r.profit
      return (
        <span style={{ color: profit >= 0 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
          {profit >= 0 ? '+' : ''}{profit.toFixed(0)} ج.م
        </span>
      )
    }},
    { key: 'margin', label: 'الهامش', render: r => {
      const margin = r.margin
      return (
        <span className={`badge ${margin >= 30 ? 'badge-success' : margin >= 15 ? 'badge-warning' : 'badge-error'}`}>
          {margin}%
        </span>
      )
    }},
    { key: 'unit', label: 'الوحدة', render: r => r.unit || '—' },
    { key: 'category', label: 'التصنيف', render: r => r.category || '—' },
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
          <h1 className="page-title">المنتجات</h1>
          <p className="page-subtitle">إدارة قائمة المنتجات والأسعار</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
            📊 رفع شيت أسعار
          </button>
          {products.length > 0 && (
            <button className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={handleDeleteAll}>
              🗑️ مسح الكل
            </button>
          )}
          <button className="btn btn-primary" onClick={openNew}>
            ➕ إضافة منتج
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, background: 'var(--info-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
        ℹ️ يقبل Excel (اسم - سعر بيع - سعر تكلفة - وحدة - تصنيف) و PDF (يستخرج الأسعار تلقائياً)
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={productsWithProfit}
          emptyMessage="لا توجد منتجات"
          emptyIcon="📦"
          onRowClick={(r) => openEdit(r)}
        />
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? 'تعديل منتج' : 'إضافة منتج'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اسم المنتج</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم المنتج" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">سعر البيع (ج.م)</label>
                  <input className="form-control" type="number" step="0.01" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">سعر التكلفة (ج.م)</label>
                  <input className="form-control" type="number" step="0.01" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} placeholder="0" />
                </div>
              </div>
              {form.sellPrice && form.costPrice && (
                <div className="flex gap-3 mb-3" style={{ background: 'var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  <span>الربح: <strong style={{ color: 'var(--success)' }}>+{(parseFloat(form.sellPrice) - parseFloat(form.costPrice)).toFixed(2)} ج.م</strong></span>
                  <span>الهامش: <strong>{parseFloat(form.sellPrice) > 0 ? Math.round(((parseFloat(form.sellPrice) - parseFloat(form.costPrice)) / parseFloat(form.sellPrice)) * 100) : 0}%</strong></span>
                </div>
              )}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">الوحدة</label>
                  <input className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="كجم / حبة" />
                </div>
                <div className="form-group">
                  <label className="form-label">التصنيف</label>
                  <input className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="خضروات / فواكه" />
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
