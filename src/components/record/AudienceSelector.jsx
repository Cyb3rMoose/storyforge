import useStoryStore from '../../store/useStoryStore'

const AUDIENCES = [
  { id: 'toddlers',      icon: '🧸', label: 'Toddlers',      age: 'Ages 1–3' },
  { id: 'young-kids',   icon: '🌟', label: 'Young Kids',    age: 'Ages 4–7' },
  { id: 'children',     icon: '⭐', label: 'Children',      age: 'Ages 8–12' },
  { id: 'teens',        icon: '🎮', label: 'Teens',         age: 'Ages 13–17' },
  { id: 'young-adults', icon: '☕', label: 'Young Adults',  age: 'Ages 18–25' },
  { id: 'adults',       icon: '🎭', label: 'Adults',        age: 'Ages 25+' },
  { id: 'family',       icon: '👨‍👩‍👧', label: 'Family',        age: 'All ages' },
  { id: 'education',    icon: '🏫', label: 'Educational',   age: 'School use' },
]

// compact=true → renders a <select> dropdown (used on Book page)
// compact=false (default) → renders the full grid of audience cards
export default function AudienceSelector({ compact = false }) {
  const { selectedAudience, setSelectedAudience } = useStoryStore()

  if (compact) {
    return (
      <select
        value={selectedAudience || ''}
        onChange={(e) => setSelectedAudience(e.target.value || null)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--border)',
          background: 'var(--paper)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.86rem',
          color: selectedAudience ? 'var(--ink)' : 'var(--muted)',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a7d9a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: '36px',
        }}
      >
        <option value="">Select audience…</option>
        {AUDIENCES.map((a) => (
          <option key={a.id} value={a.id}>
            {a.icon} {a.label} — {a.age}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '10px',
      }}
    >
      {AUDIENCES.map((a) => (
        <div
          key={a.id}
          className={`sf-audience-chip ${selectedAudience === a.id ? 'selected' : ''}`}
          onClick={() => setSelectedAudience(selectedAudience === a.id ? null : a.id)}
        >
          <div style={{ fontSize: '1.4rem', marginBottom: '5px' }}>{a.icon}</div>
          <div style={{ fontSize: '0.77rem', fontWeight: '600', color: 'var(--ink)' }}>{a.label}</div>
          <div style={{ fontSize: '0.69rem', color: 'var(--muted)', marginTop: '2px' }}>{a.age}</div>
        </div>
      ))}
    </div>
  )
}
