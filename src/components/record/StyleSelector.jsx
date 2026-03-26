import useStoryStore from '../../store/useStoryStore'

const STYLES = [
  { id: 'watercolor', label: 'Watercolor', icon: '🎨', desc: 'Soft & illustrated' },
  { id: 'cartoon',    label: 'Hand-drawn', icon: '✏️',  desc: 'Classic cartoon' },
  { id: '3d',         label: '3D Animated', icon: '🖥️', desc: 'Pixar-style' },
  { id: 'anime',      label: 'Anime',       icon: '⛩️', desc: 'Japanese style' },
  { id: 'storybook',  label: 'Storybook',   icon: '📖', desc: 'Flat & warm' },
  { id: 'silhouette', label: 'Silhouette',  icon: '🌑', desc: 'Shadow & light' },
]

export default function StyleSelector() {
  const { selectedStyle, setSelectedStyle } = useStoryStore()

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '0.83rem',
          fontWeight: '600',
          marginBottom: '9px',
          color: 'var(--ink)',
        }}
      >
        Animation Style
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStyle(selectedStyle === s.id ? null : s.id)}
            style={{
              background: selectedStyle === s.id ? 'rgba(124,92,191,0.08)' : 'var(--paper-dark)',
              border: `2px solid ${selectedStyle === s.id ? 'var(--violet)' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '11px 8px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.18s',
            }}
          >
            <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{s.icon}</div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: selectedStyle === s.id ? 'var(--violet)' : 'var(--ink)',
                marginBottom: '2px',
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--muted)' }}>{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
