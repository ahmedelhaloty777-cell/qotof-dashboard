import React, { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import NewOrder from './pages/NewOrder'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Purchase from './pages/Purchase'
import Invoices from './pages/Invoices'
import Delivery from './pages/Delivery'
import SmartRoute from './pages/SmartRoute'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function PageRouter() {
  const { currentPage } = useApp()
  switch (currentPage) {
    case 'dashboard': return <Dashboard />
    case 'orders': return <Orders />
    case 'new-order': return <NewOrder />
    case 'products': return <Products />
    case 'customers': return <Customers />
    case 'purchase': return <Purchase />
    case 'invoices': return <Invoices />
    case 'delivery': return <Delivery />
    case 'smart-route': return <SmartRoute />
    case 'analytics': return <Analytics />
    case 'reports': return <Reports />
    case 'settings': return <Settings />
    default: return <Dashboard />
  }
}

export default function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('clear') === 'all') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('qotof_'))
      keys.forEach(k => localStorage.removeItem(k))
      window.location.href = window.location.pathname
    }
  }, [])

  return (
    <AppProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <main className="page">
            <PageRouter />
          </main>
        </div>
      </div>
      <Toast />
    </AppProvider>
  )
}
