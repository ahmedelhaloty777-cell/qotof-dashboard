import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'

const AppContext = createContext()

const STORAGE_KEY = 'qotof_'
const SERVER_URL = 'http://localhost:3000'

function loadData(key) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + key)
    return raw ? JSON.parse(raw) : (key === 'settings' ? getDefaultSettings() : [])
  } catch { return key === 'settings' ? getDefaultSettings() : [] }
}

function saveData(key, data) {
  try { localStorage.setItem(STORAGE_KEY + key, JSON.stringify(data)) } catch {}
}

function getDefaultSettings() {
  return {
    threshold: 300,
    deliveryFee: 15,
    fontScale: 100,
    language: 'ar',
    theme: 'light'
  }
}

function initialState() {
  const theme = loadData('settings').theme || 'light'
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
  return {
    orders: loadData('orders'),
    products: loadData('products'),
    customers: loadData('customers'),
    expenses: loadData('expenses'),
    drivers: loadData('drivers'),
    suppliers: loadData('suppliers'),
    invoices: loadData('invoices'),
    settings: loadData('settings'),
    sidebarCollapsed: false,
    theme,
    toasts: [],
    currentPage: 'dashboard',
    selectedOrders: [],
    searchQuery: '',
    loading: { orders: false, products: false, customers: false }
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, [action.key]: action.payload, loading: { ...state.loading, [action.key]: false } }
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload, selectedOrders: [] }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'SET_THEME': {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      const settings = { ...state.settings, theme: newTheme }
      document.documentElement.setAttribute('data-theme', newTheme)
      saveData('settings', settings)
      return { ...state, theme: newTheme, settings }
    }
    case 'UPDATE_SETTINGS': {
      const settings = { ...state.settings, ...action.payload }
      saveData('settings', settings)
      return { ...state, settings }
    }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.payload }] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.payload } }
    case 'SET_SELECTED':
      return { ...state, selectedOrders: action.payload }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialState)
  const isFirstRender = useRef(true)

  const saveState = useCallback((key, data) => {
    dispatch({ type: 'SET_DATA', key, payload: data })
    saveData(key, data)
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    dispatch({ type: 'ADD_TOAST', payload: { message, type, id } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), duration)
  }, [])

  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 4)
  }, [])

  const addOrder = useCallback((order) => {
    const newOrder = { id: generateId(), ...order, createdAt: new Date().toISOString() }
    const updated = [newOrder, ...state.orders]
    saveState('orders', updated)
    return newOrder
  }, [state.orders, saveState, generateId])

  const updateOrder = useCallback((id, updates) => {
    const updated = state.orders.map(o => o.id === id ? { ...o, ...updates } : o)
    saveState('orders', updated)
  }, [state.orders, saveState])

  const deleteOrder = useCallback((id) => {
    saveState('orders', state.orders.filter(o => o.id !== id))
  }, [state.orders, saveState])

  const addProduct = useCallback((product) => {
    const newProduct = { id: generateId(), ...product }
    const updated = [...state.products, newProduct]
    saveState('products', updated)
    return newProduct
  }, [state.products, saveState, generateId])

  const bulkAddProducts = useCallback((productsArray) => {
    const newProducts = productsArray.map(p => ({ id: generateId(), ...p }))
    const updated = [...state.products, ...newProducts]
    saveState('products', updated)
    return newProducts
  }, [state.products, saveState, generateId])

  const updateProduct = useCallback((id, updates) => {
    const updated = state.products.map(p => p.id === id ? { ...p, ...updates } : p)
    saveState('products', updated)
  }, [state.products, saveState])

  const deleteProduct = useCallback((id) => {
    saveState('products', state.products.filter(p => p.id !== id))
  }, [state.products, saveState])

  const addCustomer = useCallback((customer) => {
    const newCustomer = { id: generateId(), ...customer, createdAt: new Date().toISOString() }
    const updated = [...state.customers, newCustomer]
    saveState('customers', updated)
    return newCustomer
  }, [state.customers, saveState, generateId])

  const updateCustomer = useCallback((id, updates) => {
    const updated = state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    saveState('customers', updated)
  }, [state.customers, saveState])

  const deleteCustomer = useCallback((id) => {
    saveState('customers', state.customers.filter(c => c.id !== id))
  }, [state.customers, saveState])

  const addExpense = useCallback((expense) => {
    const newExpense = { id: generateId(), ...expense, createdAt: new Date().toISOString() }
    const updated = [...state.expenses, newExpense]
    saveState('expenses', updated)
    return newExpense
  }, [state.expenses, saveState, generateId])

  const updateExpense = useCallback((id, updates) => {
    const updated = state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    saveState('expenses', updated)
  }, [state.expenses, saveState])

  const deleteExpense = useCallback((id) => {
    saveState('expenses', state.expenses.filter(e => e.id !== id))
  }, [state.expenses, saveState])

  const addDriver = useCallback((driver) => {
    const newDriver = { id: generateId(), ...driver }
    const updated = [...state.drivers, newDriver]
    saveState('drivers', updated)
    return newDriver
  }, [state.drivers, saveState, generateId])

  const updateDriver = useCallback((id, updates) => {
    const updated = state.drivers.map(d => d.id === id ? { ...d, ...updates } : d)
    saveState('drivers', updated)
  }, [state.drivers, saveState])

  const deleteDriver = useCallback((id) => {
    saveState('drivers', state.drivers.filter(d => d.id !== id))
  }, [state.drivers, saveState])

  const addSupplier = useCallback((supplier) => {
    const newSupplier = { id: generateId(), ...supplier }
    const updated = [...(state.suppliers || []), newSupplier]
    saveState('suppliers', updated)
    return newSupplier
  }, [state.suppliers, saveState, generateId])

  const updateSupplier = useCallback((id, updates) => {
    const updated = (state.suppliers || []).map(s => s.id === id ? { ...s, ...updates } : s)
    saveState('suppliers', updated)
  }, [state.suppliers, saveState])

  const deleteSupplier = useCallback((id) => {
    saveState('suppliers', (state.suppliers || []).filter(s => s.id !== id))
  }, [state.suppliers, saveState])

  const addInvoice = useCallback((invoice) => {
    const newInvoice = { id: generateId(), ...invoice, createdAt: new Date().toISOString() }
    const updated = [newInvoice, ...(state.invoices || [])]
    saveState('invoices', updated)
    return newInvoice
  }, [state.invoices, saveState, generateId])

  const deleteInvoice = useCallback((id) => {
    saveState('invoices', (state.invoices || []).filter(inv => inv.id !== id))
  }, [state.invoices, saveState])

  const getCustomerOrders = useCallback((customerId) => {
    return state.orders.filter(o => o.customerId === customerId)
  }, [state.orders])

  const isVIP = useCallback((customerId) => {
    const customerOrders = state.orders.filter(o => o.customerId === customerId)
    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    return customerOrders.length >= 3 || totalSpent >= 500
  }, [state.orders])

  const getDeliveryFee = useCallback((subtotal) => {
    const threshold = state.settings.threshold || 300
    return subtotal > threshold ? 0 : (state.settings.deliveryFee || 15)
  }, [state.settings])

  const syncServer = useRef(null)
  const lastJson = useRef('')

  useEffect(() => {
    if (isFirstRender.current) return
    const dataKeys = ['orders', 'products', 'customers', 'expenses', 'drivers', 'suppliers', 'invoices', 'settings']
    const full = {}
    dataKeys.forEach(k => { full[k] = state[k] || (k === 'settings' ? getDefaultSettings() : []) })
    const json = JSON.stringify(full)
    if (json === lastJson.current) return
    lastJson.current = json
    clearTimeout(syncServer.current)
    syncServer.current = setTimeout(() => {
      fetch(SERVER_URL + '/api/data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json
      }).catch(() => {})
    }, 300)
  }, [state.orders, state.products, state.customers, state.expenses, state.drivers, state.suppliers, state.invoices, state.settings])

  useEffect(() => {
    if (!isFirstRender.current) return
    isFirstRender.current = false
    fetch(SERVER_URL + '/api/data')
      .then(res => res.json())
      .then(data => {
        if (!data || typeof data !== 'object') return
        const keys = ['orders', 'products', 'customers', 'expenses', 'drivers', 'suppliers', 'invoices', 'settings']
        keys.forEach(key => {
          if (data[key] !== undefined) {
            dispatch({ type: 'SET_DATA', key, payload: data[key] })
            try { localStorage.setItem(STORAGE_KEY + key, JSON.stringify(data[key])) } catch {}
          }
        })
      })
      .catch(() => {})
  }, [])

  const contextValue = {
    ...state,
    dispatch,
    saveState,
    addToast,
    addOrder, updateOrder, deleteOrder,
    addProduct, bulkAddProducts, updateProduct, deleteProduct,
    addCustomer, updateCustomer, deleteCustomer,
    addExpense, updateExpense, deleteExpense,
    addDriver, updateDriver, deleteDriver,
    addSupplier, updateSupplier, deleteSupplier,
    addInvoice, deleteInvoice,
    getCustomerOrders, isVIP, getDeliveryFee,
    generateId
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

export default AppContext
