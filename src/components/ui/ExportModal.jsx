import { useState } from 'react'
import { X, Check } from 'lucide-react'

export default function ExportModal({ type, onClose }) {
  const [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  const formats =
    type === 'animation'
      ? [
          { id: 'mp4',  label: 'MP4',  icon: '🎬', desc: 'Social media & devices' },
          { id: 'gif',  label: 'GIF',  icon: '🖼️', desc: 'Works everywhere' },
          { id: 'webm', label: 'WebM', icon: '🌐', desc: 'High-quality web' },
          { id: 'mov',  label: 'MOV',  icon: '🎥', desc: 'Apple / iMovie' },
        ]
      : [
          { id: 'pdf',  label: 'PDF',  icon: '📄', desc: 'Great for printing' },
          { id: 'epub', label: 'EPUB', icon: '📱', desc: 'e-readers & Kindle' },
          { id: 'docx', label: 'DOCX', icon: '📝', desc: 'Editable Word doc' },
          { id: 'cbz',  label: 'CBZ',  icon: '💥', desc: 'Comic archive' },
        ]

  const handleExport = async () => {
    if (!selected) return
    setExporting(true)
    await new Promise((r) => setTimeout(r, 2200))
    setExporting(false)
    setDone(true)
    setTimeout(onClose, 1600)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26, 16, 37, 0.48)',
        backdropFilter: 'blur(4px)',
        zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div className="sf-card" style={{ width: '100%', maxWidth: '460px', padding: '32px', overflow: 'visible' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.35rem', fontWeight: '700', margin: 0, color: 'var(--ink)',
            }}
          >
            Export Your Creation
          </h2>
          <button className="sf-btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: '0.83rem', color: 'var(--muted)', margin: '0 0 22px' }}>
          Choose a format to share or download
        </p>

        <p style={{ fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '11px' }}>
          {type === 'animation' ? 'Animation Format' : 'Book Format'}
        </p>

        {/* Format grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', marginBottom: '22px' }}>
          {formats.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelected(f.id)}
              style={{
                padding: '13px 14px',
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${selected === f.id ? 'var(--teal)' : 'var(--border)'}`,
                background: selected === f.id ? 'rgba(42,157,143,0.07)' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ink)', marginBottom: '3px' }}>
                {f.icon} {f.label}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <button className="sf-btn-secondary" onClick={onClose}>Cancel</button>
          {done ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--teal)', fontWeight: '600', fontSize: '0.9rem' }}>
              <Check size={17} /> Download ready!
            </div>
          ) : (
            <button
              className="sf-btn-accent"
              onClick={handleExport}
              disabled={!selected || exporting}
              style={{ opacity: !selected || exporting ? 0.5 : 1, cursor: !selected ? 'not-allowed' : 'pointer' }}
            >
              {exporting ? (
                <>
                  <div className="sf-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'var(--ink)' }} />
                  Exporting…
                </>
              ) : (
                `⬇ Export ${selected ? selected.toUpperCase() : 'Now'}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
