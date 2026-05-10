import React, { useState } from 'react'

export default function LocationInput({ lat, lng, onLocationChange, label = '📍 موقع العميل' }) {
  const [input, setInput] = useState('')

  const parseLocation = (value) => {
    let newLat = null, newLng = null

    const urlMatch = value.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (urlMatch) {
      newLat = urlMatch[1]
      newLng = urlMatch[2]
    }

    const qMatch = value.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (!newLat && qMatch) {
      newLat = qMatch[1]
      newLng = qMatch[2]
    }

    const placeMatch = value.match(/\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (!newLat && placeMatch) {
      newLat = placeMatch[1]
      newLng = placeMatch[2]
    }

    const coordMatch = value.match(/^(-?\d+\.?\d*)\s*[,،\s]+\s*(-?\d+\.?\d*)$/)
    if (!newLat && coordMatch) {
      newLat = coordMatch[1]
      newLng = coordMatch[2]
    }

    if (newLat && newLng) {
      onLocationChange(newLat, newLng)
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      parseLocation(input)
    }
  }

  const openInMaps = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
    }
  }

  const clearLocation = () => {
    onLocationChange('', '')
  }

  return (
    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 12, border: '1px solid var(--border)' }}>
      <div className="flex-between mb-2">
        <label className="form-label" style={{ margin: 0 }}>{label}</label>
        {(lat || lng) && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={openInMaps}>🗺️</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={clearLocation}>✕</button>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="form-control"
          style={{ flex: 1, fontSize: 12 }}
          placeholder="الصق رابط Google Maps أو اكتب 29.943, 30.920"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-sm btn-primary" onClick={() => parseLocation(input)} disabled={!input.trim()}>
          ↵
        </button>
      </div>
      {(lat || lng) && (
        <div className="flex gap-3 mt-2" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          <span>Lat: <strong dir="ltr">{lat || '—'}</strong></span>
          <span>Lng: <strong dir="ltr">{lng || '—'}</strong></span>
        </div>
      )}
    </div>
  )
}
