import { useNavigate } from 'react-router-dom'
import { Plus, Film } from 'lucide-react'
import AnimationCard from '../components/editor/AnimationCard'
import useStoryStore from '../store/useStoryStore'

export default function EditorPage() {
  const navigate = useNavigate()
  const { animations } = useStoryStore()

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="sf-hero-label">✦ Your animations</p>
          <h1 className="sf-hero-title" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.2rem)', marginBottom: 0 }}>
            Animation <em>Editor</em>
          </h1>
        </div>
        <button className="sf-btn-primary" onClick={() => navigate('/')}>
          <Plus size={15} /> New Story
        </button>
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '24px' }}>
        Click any animation to open the editor and update it with AI prompts.
      </p>

      {animations.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '18px',
          }}
        >
          {animations.map((a) => (
            <AnimationCard key={a.id} animation={a} />
          ))}

          {/* New animation card */}
          <div
            onClick={() => navigate('/')}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              minHeight: '220px',
              cursor: 'pointer',
              color: 'var(--muted)',
              transition: 'all 0.2s',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--amber)'
              e.currentTarget.style.color = 'var(--amber)'
              e.currentTarget.style.background = 'rgba(232,160,32,0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--muted)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{ fontSize: '2rem' }}>✦</div>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Create New Animation</span>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: '40px',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: '700', margin: '0 0 8px', color: 'var(--ink)' }}>
        No animations yet
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--muted)', maxWidth: '280px', lineHeight: '1.6', marginBottom: '24px' }}>
        Record or prompt a story on the Create tab and generate your first animation.
      </p>
      <button className="sf-btn-primary" onClick={() => navigate('/')} style={{ padding: '12px 28px' }}>
        Create Your First Story
      </button>
    </div>
  )
}
