import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { PAGES } from './Sidebar'
import StatusBadge from './StatusBadge'

export default function Topbar() {
  const { currentPage, theme, dispatch, orders, products, customers } = useApp()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const searchInputRef = useRef(null)
  const notifRef = useRef(null)

  const pageInfo = PAGES.find(p => p.id === currentPage)
  const pageTitle = pageInfo ? pageInfo.label : 'لوحة التحكم'

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const pendingCount = pendingOrders.length

  const markConfirmed = (id) => {
    dispatch({ type: 'SET_PAGE', payload: 'orders' })
    setNotifOpen(false)
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setNotifOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100)
    }
  }, [searchOpen])

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allItems = [
    ...orders.map(o => ({ id: o.id, title: `طلب #${o.id?.slice(-6)}`, sub: `عميل: ${o.customerName || '?'} - ${o.total || 0} ج.م`, type: 'طلب', page: 'orders' })),
    ...products.map(p => ({ id: p.id, title: p.name || p.productName, sub: `${p.sellPrice || p.price || 0} ج.م`, type: 'منتج', page: 'products' })),
    ...customers.map(c => ({ id: c.id, title: c.name || c.customerName, sub: c.phone || c.zone || '', type: 'عميل', page: 'customers' })),
  ]

  const searchResults = searchQuery
    ? allItems.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sub?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : []

  const handleSearchSelect = (item) => {
    setSearchOpen(false)
    setSearchQuery('')
    dispatch({ type: 'SET_PAGE', payload: item.page })
  }

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">
          قطوف <span className="breadcrumb-sep">/</span> <span>{pageTitle}</span>
        </div>

        <div className="topbar-center">
          <div className="topbar-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث..."
              onFocus={() => setSearchOpen(true)}
              readOnly
            />
            <span className="search-shortcut">⌘K</span>
          </div>
        </div>

        <div className="topbar-actions">
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button className="topbar-btn" onClick={() => setNotifOpen(!notifOpen)} title="الإشعارات">
              🔔
              {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
            </button>
            {notifOpen && pendingOrders.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 8,
                width: 320, background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-xl)', zIndex: 100,
                maxHeight: 360, overflowY: 'auto'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
                  🔔 طلبات قيد الانتظار ({pendingCount})
                </div>
                {pendingOrders.slice(0, 10).map(order => (
                  <div
                    key={order.id}
                    style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontSize: 13 }}
                    onClick={() => markConfirmed(order.id)}
                  >
                    <div className="flex-between">
                      <span style={{ fontWeight: 600 }}>{order.customerName || '—'}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      #{order.id?.slice(-6)} — {order.total || 0} ج.م
                    </div>
                  </div>
                ))}
                <div style={{ padding: '8px 16px', textAlign: 'center' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => { dispatch({ type: 'SET_PAGE', payload: 'orders' }); setNotifOpen(false) }}>
                    عرض كل الطلبات →
                  </button>
                </div>
              </div>
            )}
            {notifOpen && pendingOrders.length === 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 8,
                width: 280, background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-xl)', zIndex: 100,
                padding: 24, textAlign: 'center'
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>لا توجد إشعارات</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>كل الطلبات مؤكدة</div>
              </div>
            )}
          </div>
          <button className="topbar-btn theme-toggle" onClick={() => dispatch({ type: 'SET_THEME' })} title="الوضع الليلي">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="ابحث في الطلبات، المنتجات، العملاء..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setSearchOpen(false) }}
          />
          {searchQuery && (
            <div className="search-results">
              {searchResults.length === 0 ? (
                <div className="search-result-item" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  لا توجد نتائج
                </div>
              ) : (
                searchResults.map(item => (
                  <div key={item.id} className="search-result-item" onClick={() => handleSearchSelect(item)}>
                    <div className="sr-title">{item.title}</div>
                    <div className="sr-sub">{item.sub} — {item.type}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
