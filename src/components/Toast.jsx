import React from 'react'
import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toasts, dispatch } = useApp()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'warning' && '⚠️'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}>✕</button>
        </div>
      ))}
    </div>
  )
}
