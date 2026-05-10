import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

const PAGES = [
  { id: 'dashboard',    icon: '📊', label: 'لوحة التحكم' },
  { id: 'orders',       icon: '📋', label: 'الطلبات' },
  { id: 'new-order',    icon: '➕', label: 'طلب جديد' },
  { id: 'products',     icon: '📦', label: 'المنتجات' },
  { id: 'customers',    icon: '👥', label: 'العملاء' },
  { id: 'invoices',     icon: '📄', label: 'الفواتير' },
  { id: 'purchase',     icon: '🛒', label: 'المشتريات' },
  { id: 'delivery',     icon: '🚚', label: 'التوصيل' },
  { id: 'smart-route',  icon: '🧭', label: 'خط التوصيل' },
  { id: 'analytics',    icon: '📈', label: 'التحليلات' },
  { id: 'reports',      icon: '📄', label: 'التقارير' },
  { id: 'settings',     icon: '⚙️', label: 'الإعدادات' },
]

export default function Sidebar() {
  const { currentPage, sidebarCollapsed, dispatch } = useApp()

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">ق</div>
        <div className="sidebar-brand">قطوف<span>.</span></div>
      </div>

      <nav className="sidebar-nav">
        {PAGES.map(page => (
          <button
            key={page.id}
            className={`nav-item${currentPage === page.id ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'SET_PAGE', payload: page.id })}
            title={sidebarCollapsed ? page.label : undefined}
          >
            <span className="nav-icon">{page.icon}</span>
            <span className="nav-label">{page.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">أ</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">أنا قطوف</div>
            <div className="sidebar-user-role">المالك</div>
          </div>
        </div>
      </div>

      <button
        className="sidebar-collapse-btn"
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        title={sidebarCollapsed ? 'توسيع' : 'طي'}
      >
        {sidebarCollapsed ? '◀' : '▶'}
      </button>
    </aside>
  )
}

export { PAGES }
