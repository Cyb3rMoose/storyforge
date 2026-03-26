import { useNavigate } from 'react-router-dom'

export default function AnimationCard({ animation: a }) {
  const navigate = useNavigate()

  const audiencePillClass =
    a.audience === 'Toddlers' || a.audience === 'Young Kids'
      ? 'sf-pill'
      : a.audience === 'Family' || a.audience === 'Educational'
      ? 'sf-pill-teal sf-pill'
      : 'sf-pill-rose sf-pill'

  return (
    <div
      className="sf-card"
      onClick={() => navigate(`/editor/${a.id}`)}
      style={{ cursor: 'pointer', transition: 'all 0.25s', overflow: 'visible' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lift)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
      }}
    >
      {/* Thumbnail — stays dark, it's the animation preview */}
      <div
        style={{
          height: '148px',
          background: `linear-gradient(135deg, ${a.thumb.from}, ${a.thumb.via || a.thumb.to}, ${a.thumb.to})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="sf-thumb-chars">
          {a.id === '1' ? '🐉 🦋' : a.id === '2' ? '🚀 🤖' : '⚡ 🔧'}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '0.98rem',
            fontWeight: '700',
            margin: '0 0 6px',
            color: 'var(--ink)',
            lineHeight: '1.3',
          }}
        >
          {a.title}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            fontSize: '0.75rem',
            color: 'var(--muted)',
          }}
        >
          <span className={audiencePillClass}>{a.audience}</span>
          <span>{a.style?.replace(/[^\w\s&]/gu, '').trim()}</span>
          <span>{a.duration}</span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--paper-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>📅 {a.date}</span>
        <button
          className="sf-btn-secondary"
          onClick={(e) => e.stopPropagation()}
          style={{ fontSize: '0.74rem', padding: '5px 12px' }}
        >
          Export
        </button>
      </div>
    </div>
  )
}
