import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import ExportModal from '../ui/ExportModal'

const QUICK_EDITS = [
  '☀️ Sunny meadow',
  '🐾 Add sidekick',
  '🌑 Dark & mysterious',
  '🧸 More playful',
  '❄️ Winter setting',
  '🌊 Ocean backdrop',
]

const MOOD_COLOURS = [
  { label: 'Night',     from: '#1a0a2e', to: '#2d1b4e' },
  { label: 'Deep Sea',  from: '#0a1e3a', to: '#1b3d5e' },
  { label: 'Sunset',    from: '#ff6b35', to: '#f7c59f' },
  { label: 'Daytime',   from: '#87ceeb', to: '#e0f4ff' },
  { label: 'Enchanted', from: '#2d4a22', to: '#4a7c35' },
  { label: 'Mystic',    from: '#4a0a6e', to: '#8a2be2' },
]

const AI_RESPONSES = [
  "Done! I've updated the scene with your changes. The characters now look more vibrant and the background has been adjusted to match the mood you described.",
  "Great idea! I've applied those changes. The new lighting adds a lot of drama to this scene. Want me to adjust the other scenes to match?",
  "Applied! I've modified the character's appearance — the new look fits perfectly with the story's tone.",
  "Excellent suggestion! I've reworked the background scenery. The depth and atmosphere have been significantly improved.",
  "Done! The colour palette has been shifted to give a more magical feel. I can also adjust the character colours to complement if you'd like.",
]

const STARS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  width:  Math.random() * 2 + 1,
  height: Math.random() * 2 + 1,
  top:    Math.random() * 60,
  left:   Math.random() * 100,
}))

function AnimationCanvas({ animation, activeScene, playing, onPlayingChange, videoRef, onTimeUpdate, onDurationChange }) {
  const scene = animation.sceneList?.[activeScene] ?? animation.sceneList?.[0]

  useEffect(() => {
    if (!videoRef?.current) return
    if (playing) {
      videoRef.current.play().catch(() => onPlayingChange(false))
    } else {
      videoRef.current.pause()
    }
  }, [playing, onPlayingChange, videoRef])

  if (animation.videoUrl) {
    return (
      <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius)', overflow: 'hidden', background: '#000' }}>
        <video
          ref={videoRef}
          src={animation.videoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onEnded={() => onPlayingChange(false)}
          onTimeUpdate={(e) => onTimeUpdate?.(e.target.currentTime)}
          onLoadedMetadata={(e) => onDurationChange?.(e.target.duration)}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        background: scene
          ? `linear-gradient(135deg, ${scene.from}, ${scene.to})`
          : `linear-gradient(135deg, ${animation.thumb.from}, ${animation.thumb.to})`,
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 10% 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {STARS.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            width: `${s.width}px`,
            height: `${s.height}px`,
            borderRadius: '50%',
            background: 'white',
            top: `${s.top}%`,
            left: `${s.left}%`,
            opacity: 0.7,
          }}
        />
      ))}

      <div style={{ display: 'flex', gap: '44px', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
        <div style={{ animation: 'float-char 3s ease-in-out infinite', textAlign: 'center' }}>
          <div
            style={{
              background: 'white',
              color: 'var(--ink)',
              fontFamily: "'Caveat', cursive",
              fontSize: '0.9rem',
              padding: '6px 12px',
              borderRadius: '14px 14px 14px 4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              marginBottom: '6px',
            }}
          >
            Once upon a time…
          </div>
          <div style={{ fontSize: '2.4rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}>
            {animation.id === '1' ? '🐉' : animation.id === '2' ? '🚀' : '⚡'}
          </div>
        </div>
        <div style={{ animation: 'float-char 3s ease-in-out infinite', animationDelay: '0.5s', fontSize: '2.4rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}>
          {animation.id === '1' ? '🦋' : animation.id === '2' ? '🤖' : '🔧'}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Caveat', cursive",
          color: 'rgba(255,255,255,0.65)',
          fontSize: '1rem',
          whiteSpace: 'nowrap',
        }}
      >
        {scene?.label} — {scene?.desc}
      </div>
    </div>
  )
}

export default function AnimationEditor({ animation }) {
  const navigate = useNavigate()
  const [activeScene, setActiveScene] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef(null)
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hi! I'm editing "${animation.title}". What would you like to change?` },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [selectedChar1, setSelectedChar1] = useState('🐉 Dragon')
  const [selectedChar2, setSelectedChar2] = useState('🦄 Unicorn')
  const [selectedScenery, setSelectedScenery] = useState('🌙 Night Forest')
  const [selectedSkyMood, setSelectedSkyMood] = useState(0)
  const [selectedStoryMood, setSelectedStoryMood] = useState(0)
  const chatBottomRef = useRef(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setThinking(true)
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
    setMessages((m) => [...m, { role: 'ai', text: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)] }])
    setThinking(false)
  }

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Back */}
      <button className="sf-back-btn" onClick={() => navigate('/editor')}>
        ← Back to Editor
      </button>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p className="sf-hero-label">✦ {animation.audience} · {animation.style?.replace(/[^\w\s&]/gu, '').trim()}</p>
          <h1 className="sf-hero-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', marginBottom: 0 }}>
            {animation.title}
          </h1>
        </div>
        <button className="sf-btn-accent" onClick={() => setShowExport(true)}>
          ⬇ Export
        </button>
      </div>

      {/* Editor layout */}
      <div
        className="sf-editor-layout"
        style={{ display: 'grid', gridTemplateColumns: '1fr 295px', gap: '20px', alignItems: 'start' }}
      >
        {/* Left: canvas + scene strip + chat */}
        <div>
          {/* Canvas */}
          <div className="sf-card" style={{ marginBottom: '18px', overflow: 'visible' }}>
            <div style={{ padding: '16px 20px 0' }}>
              <AnimationCanvas
                animation={animation}
                activeScene={activeScene}
                playing={playing}
                onPlayingChange={setPlaying}
                videoRef={videoRef}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setDuration}
              />
            </div>

            {/* Playback controls */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '13px 18px',
                borderTop: '1px solid var(--border)',
                background: 'var(--paper-dark)',
              }}
            >
              <button className="sf-control-btn" onClick={() => setPlaying((p) => !p)}>
                {playing ? '⏸' : '▶'}
              </button>
              <button className="sf-control-btn" onClick={() => { if (videoRef.current) { videoRef.current.currentTime = 0; setCurrentTime(0) } }}>⏮</button>
              <div
                style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '4px', cursor: 'pointer', position: 'relative' }}
                onClick={(e) => {
                  if (!videoRef.current) return
                  const dur = videoRef.current.duration
                  if (!dur || isNaN(dur)) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                  videoRef.current.currentTime = pct * dur
                  setCurrentTime(pct * dur)
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(duration || videoRef.current?.duration) ? (currentTime / (duration || videoRef.current.duration)) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, var(--rose), var(--amber))',
                    borderRadius: '4px',
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              <button className="sf-control-btn">⏭</button>
              <span style={{ fontSize: '0.76rem', color: 'var(--muted)', minWidth: '58px', textAlign: 'right' }}>
                {animation.duration}
              </span>
            </div>
          </div>

          {/* Scene strip */}
          <div className="sf-card" style={{ marginBottom: '18px' }}>
            <div style={{ padding: '14px 18px' }}>
              <p className="sf-section-label" style={{ marginBottom: '10px' }}>Scenes</p>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {animation.sceneList.map((scene, i) => (
                  <div
                    key={scene.id}
                    className={`sf-scene-item ${activeScene === i ? 'active' : ''}`}
                    onClick={() => setActiveScene(i)}
                  >
                    <div
                      style={{
                        height: '58px',
                        background: `linear-gradient(135deg, ${scene.from}, ${scene.to})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                      }}
                    >
                      {i === 0 ? '🌙' : i === 1 ? '🌊' : i === 2 ? '🏔️' : i === 3 ? '🌅' : '✨'}
                    </div>
                    <div style={{ padding: '5px 8px', background: 'var(--paper-dark)', fontSize: '0.69rem', fontWeight: activeScene === i ? '600' : '400' }}>
                      {scene.label}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '90px',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem' }}>＋</div>
                    <div style={{ fontSize: '0.68rem', marginTop: '3px' }}>Add</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Chat Editor */}
          <div className="sf-card">
            <div className="sf-card-header">
              <h2 className="sf-card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Sparkles size={16} color="var(--violet)" /> AI Animation Editor
              </h2>
              <span className="sf-pill-violet sf-pill">Prompt to Edit</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                Describe any change — characters, scenes, mood, dialogue — and AI will update your animation instantly.
              </p>

              {/* Messages */}
              <div
                style={{
                  maxHeight: '210px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'sf-chat-msg-user' : 'sf-chat-msg-ai'}>
                    {m.role === 'ai' && <strong style={{ color: 'var(--violet)' }}>🤖 </strong>}
                    {m.text}
                  </div>
                ))}
                {thinking && (
                  <div className="sf-chat-msg-ai" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: 'var(--muted)',
                          animation: 'pulse-dot 1s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input row */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  className="sf-ai-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="e.g. Change the dragon to a robot and set the scene at sunrise…"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || thinking}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--violet)',
                    border: 'none',
                    color: 'white',
                    cursor: !input.trim() || thinking ? 'not-allowed' : 'pointer',
                    opacity: !input.trim() || thinking ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  <Send size={15} />
                </button>
              </div>

              {/* Quick edits */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {QUICK_EDITS.map((q) => (
                  <button
                    key={q}
                    className="sf-chip"
                    onClick={() => setInput(q)}
                    style={{ fontSize: '0.76rem' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Characters */}
          <div className="sf-editor-panel">
            <div className="sf-editor-panel-header">🧑‍🎨 Characters</div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Character 1</p>
                {['🐉 Dragon', '🦁 Lion', '🧙 Wizard', '🤖 Robot', '👸 Princess'].map((c) => (
                  <button key={c} className={`sf-editor-tag ${selectedChar1 === c ? 'active' : ''}`} onClick={() => setSelectedChar1(c)}>{c}</button>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Character 2</p>
                {['🦄 Unicorn', '🐰 Rabbit', '🧚 Fairy', '🦊 Fox'].map((c) => (
                  <button key={c} className={`sf-editor-tag ${selectedChar2 === c ? 'active' : ''}`} onClick={() => setSelectedChar2(c)}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Scenery */}
          <div className="sf-editor-panel">
            <div className="sf-editor-panel-header">🌄 Scenery</div>
            <div style={{ padding: '14px 16px' }}>
              {['🌙 Night Forest', '🌅 Sunrise', '🏰 Castle', '🌊 Ocean', '❄️ Winter', '🌸 Blossom'].map((s) => (
                <button key={s} className={`sf-editor-tag ${selectedScenery === s ? 'active' : ''}`} onClick={() => setSelectedScenery(s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* Sky Mood */}
          <div className="sf-editor-panel">
            <div className="sf-editor-panel-header">🎨 Sky Mood</div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {MOOD_COLOURS.map((m, i) => (
                  <div
                    key={m.label}
                    title={m.label}
                    onClick={() => setSelectedSkyMood(i)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${m.from}, ${m.to})`,
                      cursor: 'pointer',
                      border: `2px solid ${selectedSkyMood === i ? 'var(--ink)' : 'transparent'}`,
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '7px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Story Mood</p>
              {['😊 Joyful', '😱 Thrilling', '😢 Emotional', '😂 Funny'].map((m, i) => (
                <button key={m} className={`sf-editor-tag ${selectedStoryMood === i ? 'active' : ''}`} onClick={() => setSelectedStoryMood(i)}>{m}</button>
              ))}
            </div>
          </div>

          {/* Story details */}
          <div className="sf-editor-panel">
            <div className="sf-editor-panel-header">📖 Story Details</div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.77rem', fontWeight: '600', marginBottom: '5px', color: 'var(--ink)' }}>Title</label>
                <input
                  className="sf-ai-input"
                  defaultValue={animation.title}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.77rem', fontWeight: '600', marginBottom: '5px', color: 'var(--ink)' }}>Narrator Voice</label>
                <select
                  style={{
                    width: '100%', padding: '9px 13px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--paper)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.84rem',
                    color: 'var(--ink)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option>🧓 Warm Grandparent</option>
                  <option>🧚 Playful Fairy</option>
                  <option>🎭 Dramatic Storyteller</option>
                  <option>🤖 Neutral AI</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showExport && <ExportModal type="animation" onClose={() => setShowExport(false)} />}
    </div>
  )
}
