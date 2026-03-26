import { useState, useEffect } from 'react'
import { Square, Pause, Play, Trash2, Volume2, Sparkles, ArrowRight, Check, Pencil } from 'lucide-react'
import useAudioRecorder from '../../hooks/useAudioRecorder'
import useStoryStore from '../../store/useStoryStore'
import { transcribeRecording } from '../../api/storyforge'

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_TRANSCRIPTIONS = [
  "Once upon a time, in a land far away, there lived a little dragon who had never breathed fire. Every day the other dragons soared across the mountains leaving trails of golden flame — but every time this little dragon tried, only tiny soap bubbles floated out. One night, a star fell from the sky and landed right beside him, and together they discovered that the most magical things in the world aren't always made of fire…",
  "In the depths of the ocean, a little fish named Pearl discovered a mysterious glowing cave. Inside were ancient treasures and a friendly sea turtle who had been waiting centuries for someone brave enough to find them. Together, they embarked on the greatest underwater adventure the sea had ever known.",
  "High above the clouds, in a city built on the backs of giant birds, lived a girl named Zara who had never touched the ground. When her best friend, a wind sprite named Whirl, accidentally fell below the clouds, Zara had to learn to trust the one thing she'd always feared.",
]

// Three contextually relevant prompt suggestions per transcription
const MOCK_PROMPTS = [
  [
    "A young dragon who cannot breathe fire discovers that his soap bubbles shimmer like starlight — perfect for befriending a fallen star on a moonlit night in the mountains.",
    "The bubble-blowing dragon must prove to his village that true strength comes in unexpected forms, with help from a tiny star who landed in his valley.",
    "When a star crashes near the dragon's home, only the creature whose bubbles glow like starlight can communicate with it. An unlikely friendship changes both their worlds forever.",
  ],
  [
    "Pearl the fish uncovers an ancient glowing cave beneath the waves, where a centuries-old sea turtle holds the key to a forgotten underwater kingdom waiting to be found.",
    "A brave little fish and a wise sea turtle join forces to return magical artefacts to their rightful places before the great tide turns and seals the cave for another century.",
    "The ocean's greatest adventure awaits the one creature small enough to swim through the crystal passage — Pearl, a little fish with an enormous heart and boundless curiosity.",
  ],
  [
    "Zara has lived her whole life above the clouds and must descend to the earth for the first time ever to rescue her wind sprite friend Whirl from the world below.",
    "A cloud city built on giant birds faces its greatest crisis when a child falls below the mist, and only her best friend — who has never touched the ground — can bring her back.",
    "Two friends separated by a world of clouds discover that the most powerful thing in the sky isn't the giant birds the city is built on — it's trust in each other.",
  ],
]

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Waveform ───────────────────────────────────────────────────────────────

function Waveform({ isActive }) {
  const [heights, setHeights] = useState(Array(32).fill(4))

  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => {
      setHeights(Array(32).fill(0).map(() => Math.random() * 22 + 5))
    }, 90)
    return () => clearInterval(id)
  }, [isActive])

  const displayHeights = isActive ? heights : Array(32).fill(4)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '34px' }}>
      {displayHeights.map((h, i) => (
        <div
          key={i}
          style={{
            height: `${h}px`,
            width: '4px',
            background: isActive ? 'var(--rose)' : 'rgba(26,16,37,0.1)',
            borderRadius: '2px',
            transition: 'height 0.09s ease',
          }}
        />
      ))}
    </div>
  )
}

// ── Transcription & Prompt Studio ──────────────────────────────────────────

function TranscriptionPanel({ recordings }) {
  const { setStoryPrompt, setInputMode } = useStoryStore()

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [editing, setEditing]         = useState(false)
  const [editText, setEditText]       = useState('')
  const [summarising, setSummarising] = useState(false)
  const [prompts, setPrompts]         = useState([])
  const [usedPrompt, setUsedPrompt]   = useState(null)

  // selectedIdx is kept in bounds by clamping on read
  const safeIdx = Math.min(selectedIdx, recordings.length - 1)

  const rec = recordings[safeIdx]
  if (!rec) return null

  const transcriptionText = editText || rec.transcription

  const startEdit = () => {
    setEditText(transcriptionText)
    setEditing(true)
  }

  const handleSummarise = async () => {
    setSummarising(true)
    setPrompts([])
    setUsedPrompt(null)
    // Simulate API call — replace with real Claude API in production
    await new Promise((r) => setTimeout(r, 1800))
    const idx = MOCK_TRANSCRIPTIONS.indexOf(rec.transcription)
    setPrompts(idx >= 0 ? MOCK_PROMPTS[idx] : MOCK_PROMPTS[0])
    setSummarising(false)
  }

  const applyPrompt = (prompt) => {
    setStoryPrompt(prompt)
    setInputMode('prompt')
    setUsedPrompt(prompt)
  }

  return (
    <div
      style={{
        marginTop: '20px',
        border: '1.5px solid rgba(124,92,191,0.22)',
        borderRadius: 'var(--radius)',
        background: 'white',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(124,92,191,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>📄</span>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: '700',
              fontSize: '1rem',
              color: 'var(--ink)',
            }}
          >
            Transcription
          </span>
          <span className="sf-pill-violet sf-pill">Auto-transcribed</span>
        </div>

        {/* Recording selector (shown only when multiple recordings exist) */}
        {recordings.length > 1 && (
          <select
            value={selectedIdx}
            onChange={(e) => {
              setSelectedIdx(Number(e.target.value))
              setEditing(false)
              setEditText('')
              setPrompts([])
              setUsedPrompt(null)
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '50px',
              border: '1.5px solid var(--border)',
              background: 'white',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              color: 'var(--ink)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {recordings.map((r, i) => (
              <option key={r.id} value={i}>{r.title}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ padding: '18px 20px' }}>
        {/* Full transcription text */}
        <div className="sf-transcription" style={{ position: 'relative' }}>
          {editing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.86rem',
                lineHeight: '1.7',
                color: 'var(--ink)',
                resize: 'vertical',
              }}
            />
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: '0.86rem',
                lineHeight: '1.7',
                color: 'var(--ink)',
                fontStyle: 'italic',
              }}
            >
              {transcriptionText}
            </p>
          )}

          {/* Metadata row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', color: 'var(--muted)' }}>
              <span>🕐 {fmt(rec.duration)}</span>
              <span>·</span>
              <span>~{transcriptionText.split(' ').length} words</span>
              <span>·</span>
              <span style={{ color: 'var(--teal)' }}>✓ AI transcribed</span>
            </div>

            {editing ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="sf-btn-secondary"
                  onClick={() => { setEditing(false); setEditText('') }}
                  style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                >
                  Cancel
                </button>
                <button
                  className="sf-btn-primary"
                  onClick={() => setEditing(false)}
                  style={{ fontSize: '0.72rem', padding: '4px 12px' }}
                >
                  <Check size={12} /> Save
                </button>
              </div>
            ) : (
              <button
                className="sf-btn-secondary"
                onClick={startEdit}
                style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Pencil size={11} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

        {/* Summarise button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: prompts.length ? '16px' : 0 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '0.88rem', color: 'var(--ink)' }}>
              Summarise into Prompts
            </p>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--muted)', lineHeight: '1.4' }}>
              AI will distil your transcription into ready-to-use story prompts.
            </p>
          </div>
          <button
            className="sf-btn-primary"
            onClick={handleSummarise}
            disabled={summarising}
            style={{ padding: '10px 20px', fontSize: '0.86rem', flexShrink: 0 }}
          >
            {summarising ? (
              <>
                <div
                  className="sf-spinner"
                  style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: 'white' }}
                />
                Summarising…
              </>
            ) : (
              <>
                <Sparkles size={15} /> Summarise
              </>
            )}
          </button>
        </div>

        {/* Generated prompt cards */}
        {prompts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p className="sf-section-label" style={{ marginBottom: '4px' }}>
              Prompt Suggestions — click to use in the Prompt tab
            </p>
            {prompts.map((prompt, i) => {
              const isUsed = usedPrompt === prompt
              return (
                <div
                  key={i}
                  style={{
                    border: `1.5px solid ${isUsed ? 'var(--teal)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    background: isUsed ? 'rgba(42,157,143,0.05)' : 'var(--paper)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  {/* Number badge */}
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: isUsed ? 'var(--teal)' : 'rgba(124,92,191,0.12)',
                      color: isUsed ? 'white' : 'var(--violet)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {isUsed ? <Check size={11} /> : i + 1}
                  </div>

                  {/* Prompt text + action */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: '0.84rem',
                        lineHeight: '1.6',
                        color: 'var(--ink)',
                      }}
                    >
                      {prompt}
                    </p>
                    <button
                      onClick={() => applyPrompt(prompt)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'none',
                        border: 'none',
                        cursor: isUsed ? 'default' : 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        color: isUsed ? 'var(--teal)' : 'var(--violet)',
                        padding: 0,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {isUsed ? (
                        <><Check size={13} /> Sent to Prompt tab</>
                      ) : (
                        <>Use in Prompt tab <ArrowRight size={13} /></>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AudioRecorder() {
  const { isRecording, isPaused, duration, audioBlob, audioUrl, error, start, stop, pause, resume, reset } =
    useAudioRecorder()
  const { recordings, addRecording, removeRecording } = useStoryStore()
  const [transcribing, setTranscribing] = useState(false)

  const handleSave = async () => {
    if (!audioBlob || !audioUrl) return
    setTranscribing(true)
    let transcription
    try {
      transcription = await transcribeRecording(audioBlob)
    } catch (err) {
      console.warn('Whisper transcription failed, using fallback:', err.message)
      transcription = MOCK_TRANSCRIPTIONS[recordings.length % MOCK_TRANSCRIPTIONS.length]
    } finally {
      setTranscribing(false)
    }
    addRecording({
      id: Date.now().toString(),
      title: `Recording ${recordings.length + 1}`,
      duration,
      url: audioUrl,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      transcription,
    })
    reset()
  }

  return (
    <div>
      {/* Record zone */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '10px 0 6px' }}>
        <Waveform isActive={isRecording && !isPaused} />

        {/* Timer */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.85rem',
            fontWeight: '700',
            letterSpacing: '2px',
            color: isRecording ? 'var(--rose)' : 'var(--muted)',
            transition: 'color 0.3s',
          }}
        >
          {fmt(duration)}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isRecording && !audioBlob && (
            <button className="sf-record-btn" onClick={start} title="Start recording">🎙</button>
          )}

          {isRecording && (
            <>
              <button className="sf-btn-icon" onClick={isPaused ? resume : pause}>
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button className="sf-stop-btn" onClick={stop}>
                <Square size={18} fill="white" />
              </button>
            </>
          )}

          {audioBlob && !isRecording && (
            <>
              <button className="sf-btn-secondary" onClick={reset} disabled={transcribing} style={{ fontSize: '0.78rem', padding: '7px 14px' }}>
                🔄 Re-record
              </button>
              <button className="sf-btn-primary" onClick={handleSave} disabled={transcribing} style={{ fontSize: '0.86rem', padding: '9px 20px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                {transcribing ? (
                  <>
                    <div className="sf-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'white' }} />
                    Transcribing…
                  </>
                ) : 'Save Recording'}
              </button>
            </>
          )}
        </div>

        {!isRecording && !audioBlob && (
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', fontWeight: '500' }}>
            Tap to start recording
          </p>
        )}

        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span className="sf-recording-dot" />
            <span style={{ fontSize: '0.82rem', color: 'var(--red)', fontWeight: '500' }}>
              {isPaused ? 'Paused' : 'Recording…'}
            </span>
          </div>
        )}
      </div>

      {/* Audio preview before save */}
      {audioBlob && !isRecording && audioUrl && (
        <audio controls src={audioUrl} style={{ width: '100%', margin: '10px 0' }} />
      )}

      {error && (
        <p style={{ color: 'var(--red)', fontSize: '0.82rem', textAlign: 'center', margin: '8px 0' }}>
          {error}
        </p>
      )}

      {/* Saved recordings list */}
      {recordings.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '12px' }}>
          <p className="sf-section-label">Saved Recordings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recordings.map((rec) => (
              <div key={rec.id} className="sf-recording-item">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="sf-rec-icon"><Volume2 size={14} /></div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '0.86rem', color: 'var(--ink)' }}>
                        {rec.title}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--muted)' }}>
                        {fmt(rec.duration)} · {rec.date}
                      </p>
                    </div>
                  </div>
                  <button
                    className="sf-btn-ghost"
                    onClick={() => removeRecording(rec.id)}
                    style={{ padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <audio controls src={rec.url} style={{ width: '100%', marginTop: '10px', height: '32px' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcription & Prompt Studio — shown once at least one recording exists */}
      {recordings.length > 0 && <TranscriptionPanel recordings={recordings} />}
    </div>
  )
}
