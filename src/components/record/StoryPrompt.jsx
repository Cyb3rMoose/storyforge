import useStoryStore from '../../store/useStoryStore'

const INSPIRATIONS = [
  { label: '🐉 Dragon & a star', text: 'A little dragon who cannot breathe fire befriends a star that fell from the sky. Together they discover that true magic comes from kindness, not power.' },
  { label: '🧚 Fairy kingdom', text: 'A young fairy discovers a hidden map inside an old oak tree that leads to a lost kingdom where all forgotten dreams come true.' },
  { label: '🚀 Space explorers', text: 'Three young astronauts on a school trip to the moon accidentally blast off to a distant galaxy and must find their way home using only their friendship.' },
  { label: '🐠 Ocean mystery', text: 'A curious dolphin finds a glowing bottle at the bottom of the ocean containing a message from a child on the surface.' },
  { label: '🦁 Lost lion cub', text: 'A lion cub separated from his pride must cross the great savanna alone, befriending an unlikely family of animals.' },
]

const LENGTHS = [
  { id: '5s',  label: '~4s',  desc: '1 clip' },
  { id: '10s', label: '~8s',  desc: '1 clip' },
  { id: '20s', label: '~16s', desc: '2 clips' },
  { id: '30s', label: '~24s', desc: '3 clips' },
]

export default function StoryPrompt() {
  const { storyPrompt, setStoryPrompt, selectedLength, setSelectedLength } = useStoryStore()
  const length = selectedLength
  const setLength = setSelectedLength

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', marginBottom: '7px', color: 'var(--ink)' }}
        >
          Describe your story
        </label>
        <textarea
          className="sf-textarea"
          value={storyPrompt}
          onChange={(e) => setStoryPrompt(e.target.value)}
          placeholder="e.g. A brave little fox who is afraid of the dark discovers a glowing firefly who becomes her guide through the Enchanted Forest…"
          rows={5}
          style={{ padding: '13px' }}
        />
      </div>

      {/* Inspiration chips */}
      <div>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: '600', marginBottom: '8px' }}>
          ✦ Need inspiration?
        </p>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {INSPIRATIONS.map((chip) => (
            <button
              key={chip.label}
              className="sf-chip"
              onClick={() => setStoryPrompt(chip.text)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Length */}
      <div style={{ marginTop: '16px' }}>
        <label
          style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', marginBottom: '7px', color: 'var(--ink)' }}
        >
          Animation length
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {LENGTHS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLength(l.id)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: `1.5px solid ${length === l.id ? 'var(--violet)' : 'var(--border)'}`,
                background: length === l.id ? 'rgba(124,92,191,0.08)' : 'var(--paper-dark)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.18s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: length === l.id ? 'var(--violet)' : 'var(--ink)',
                  marginBottom: '2px',
                }}
              >
                {l.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
