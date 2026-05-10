import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function Reports() {
  const { orders, expenses, updateExpense, deleteExpense, addExpense, addToast, products } = useApp()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'مصروفات تشغيل' })

  const today = new Date().toISOString().split('T')[0]

  const monthlyData = useMemo(() => {
    const month = new Date().toISOString().substring(0, 7)
    const monthOrders = orders.filter(o => o.createdAt?.startsWith(month) && o.status !== 'cancelled')
    const monthExpenses = expenses.filter(e => e.createdAt?.startsWith(month))
    const revenue = monthOrders.reduce((s, o) => s + (o.total || 0), 0)

    const cogs = monthOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((itemSum, item) => {
        const product = products.find(p => (p.name || p.productName) === (item.name || item.productName))
        return itemSum + ((product?.cost || product?.price || item.price || 0) * (item.quantity || 0) * 0.6)
      }, 0)
    }, 0)

    const operatingExpenses = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0)
    const netProfit = revenue - cogs - operatingExpenses

    return { revenue, cogs, operatingExpenses, netProfit, orderCount: monthOrders.length }
  }, [orders, expenses, products])

  const openNewExpense = () => {
    setEditExpense(null)
    setExpenseForm({ description: '', amount: '', category: 'مصروفات تشغيل' })
    setShowExpenseForm(true)
  }

  const openEditExpense = (e) => {
    setEditExpense(e)
    setExpenseForm({ description: e.description, amount: e.amount, category: e.category })
    setShowExpenseForm(true)
  }

  const handleSaveExpense = () => {
    if (!expenseForm.description || !expenseForm.amount) {
      addToast('الرجاء إدخال البيان والمبلغ', 'warning')
      return
    }
    const data = {
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category
    }
    if (editExpense) {
      updateExpense(editExpense.id, data)
      addToast('تم تحديث المصروف', 'success')
    } else {
      addExpense(data)
      addToast('تم إضافة المصروف', 'success')
    }
    setShowExpenseForm(false)
  }

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)

  const expenseColumns = [
    { key: 'description', label: 'البيان' },
    { key: 'category', label: 'التصنيف' },
    { key: 'amount', label: 'المبلغ', render: r => `${(r.amount || 0).toLocaleString()} ج.م` },
    { key: 'createdAt', label: 'التاريخ', render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : '—' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📄 التقارير المالية</h1>
          <p className="page-subtitle">تحليل الربح والخسارة</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center', borderRight: '4px solid var(--secondary)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>الإيرادات (هذا الشهر)</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--secondary)' }}>{monthlyData.revenue.toLocaleString()} ج.م</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{monthlyData.orderCount} طلب</div>
        </div>
        <div className="card" style={{ textAlign: 'center', borderRight: `4px solid ${monthlyData.netProfit >= 0 ? 'var(--success)' : 'var(--error)'}` }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>صافي الربح</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: monthlyData.netProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
            {monthlyData.netProfit >= 0 ? '+' : ''}{monthlyData.netProfit.toLocaleString()} ج.م
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <h3 className="card-title mb-3">قائمة الدخل — {new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</h3>
        <div style={{ padding: '12px 0' }}>
          <div className="flex-between" style={{ padding: '8px 0' }}>
            <span>الإيرادات</span>
            <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{monthlyData.revenue.toLocaleString()} ج.م</span>
          </div>
          <div className="flex-between" style={{ padding: '8px 0', color: 'var(--text-muted)' }}>
            <span>تكلفة البضاعة (تقديري)</span>
            <span style={{ fontWeight: 600 }}>- {Math.round(monthlyData.cogs).toLocaleString()} ج.م</span>
          </div>
          <div className="flex-between" style={{ padding: '8px 0', color: 'var(--text-muted)' }}>
            <span>المصروفات التشغيلية</span>
            <span style={{ fontWeight: 600 }}>- {monthlyData.operatingExpenses.toLocaleString()} ج.م</span>
          </div>
          <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '8px 0' }} />
          <div className="flex-between" style={{ padding: '8px 0', fontSize: 18 }}>
            <span style={{ fontWeight: 700 }}>صافي الربح</span>
            <span style={{ fontWeight: 800, color: monthlyData.netProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {monthlyData.netProfit >= 0 ? '+' : ''}{monthlyData.netProfit.toLocaleString()} ج.م
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">سجل المصروفات</h3>
          <button className="btn btn-sm btn-primary" onClick={openNewExpense}>➕ إضافة مصروف</button>
        </div>
        <div>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-text">لا توجد مصروفات</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {expenseColumns.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(e => (
                    <tr key={e.id}>
                      {expenseColumns.map(col => (
                        <td key={col.key}>{col.render ? col.render(e) : e[col.key]}</td>
                      ))}
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-ghost" onClick={() => openEditExpense(e)}>✏️</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => { if (window.confirm('حذف؟')) { deleteExpense(e.id); addToast('تم الحذف', 'success') } }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, background: 'var(--border-light)' }}>
                    <td colSpan={2}>الإجمالي</td>
                    <td>{totalExpenses.toLocaleString()} ج.م</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showExpenseForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowExpenseForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editExpense ? 'تعديل مصروف' : 'إضافة مصروف'}</h2>
              <button className="modal-close" onClick={() => setShowExpenseForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">البيان</label>
                <input className="form-control" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="وصف المصروف" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">المبلغ</label>
                  <input className="form-control" type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">التصنيف</label>
                  <select className="form-control" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                    <option value="مصروفات تشغيل">مصروفات تشغيل</option>
                    <option value="وقود">وقود</option>
                    <option value="صيانة">صيانة</option>
                    <option value="تعبئة وتغليف">تعبئة وتغليف</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowExpenseForm(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={handleSaveExpense}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
