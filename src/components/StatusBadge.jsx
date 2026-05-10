import React from 'react'

const STATUS_MAP = {
  pending: { label: 'قيد الانتظار', icon: '⏳', className: 'badge-warning', dotClass: 'pending' },
  confirmed: { label: 'تم التأكيد', icon: '✅', className: 'badge-info', dotClass: 'confirmed' },
  'on-way': { label: 'في الطريق', icon: '🚚', className: 'badge-info', dotClass: 'on-way' },
  delivered: { label: 'تم التوصيل', icon: '🎉', className: 'badge-success', dotClass: 'delivered' },
  cancelled: { label: 'ملغي', icon: '❌', className: 'badge-error', dotClass: 'cancelled' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, icon: '❓', className: 'badge-neutral', dotClass: '' }
  return (
    <span className={`badge ${s.className}`}>
      <span className={`status-dot ${s.dotClass}`} />
      {s.icon} {s.label}
    </span>
  )
}

export { STATUS_MAP }
