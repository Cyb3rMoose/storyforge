import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import AudienceSelector from '../components/record/AudienceSelector'
import ExportModal from '../components/ui/ExportModal'
import useStoryStore from '../store/useStoryStore'

const BOOK_TYPES = [
  { id: 'novel',   label: 'Novel',        icon: '📖', desc: 'Rich prose with chapters' },
  { id: 'comic',   label: 'Comic Book',   icon: '💥', desc: 'Panels & speech bubbles' },
  { id: 'manga',   label: 'Manga',        icon: '🗾', desc: 'Japanese-style B&W' },
  { id: 'picture', label: 'Picture Book', icon: '🖼️', desc: 'Illustrations + simple text' },
  { id: 'graphic', label: 'Graphic Novel',icon: '🦸', desc: 'Long-form illustrated' },
  { id: 'script',  label: 'Audio Script', icon: '🎙️', desc: 'Formatted for narration' },
]

const MOCK_EXCERPTS = {
  novel: `Chapter One: The Beginning of Everything

The morning Ember discovered the empty treasure chamber, the sun had barely risen above the Crimson Peaks. She stood at the stone threshold, her golden scales catching what little light filtered through the narrow cave entrance, and felt something she had never experienced before — a hollow ache deep inside her chest where certainty used to live.

"Someone has taken it," she whispered to no one in particular.

The Ember's Flame — a ruby the size of a dragon's eye that had protected her clan for three hundred years — was gone. She spread her wings and called out for Luna.`,

  comic: `[PANEL 1: Wide shot of dark dragon cave. EMBER stands at the entrance, eyes wide.]
CAPTION: Dawn breaks over the Crimson Peaks...
EMBER: (thought bubble) Something's… wrong.

[PANEL 2: Close-up of empty stone pedestal.]
SFX: *silence*

[PANEL 3: EMBER roars skyward, wings spread dramatically.]
EMBER: LUNA!!  SFX: ROOOAAR!!!

[PANEL 4: Tiny fairy LUNA zooms in, trailing sparkles.]
LUNA: Wha— Ember! I heard you from the Crystal Spring!
EMBER: It's been stolen. We need to find it.`,

  picture: `Once there was a little dragon called Ember.

Ember had golden scales that shone like the sun.
But today, Ember was very, very sad.

"Someone took the special ruby," said Ember.
"The one that kept our home safe."

Ember's friend Luna the fairy flew close.
"Don't worry," said Luna with a smile.
"We will find it together!"

And so the two friends set off on the
biggest adventure of their lives.`,

  manga: `ページ１ (Page 1)

コマ１: 洞窟の入り口。エンバーは目を見開いて立っている。
EMBER: 「…消えた」

コマ２: 空の台座のクローズアップ。
効果音: シーン…

コマ３: エンバーが叫ぶ。翼を広げて。
EMBER: 「ルーナ！！！」

コマ４: ルーナが飛んでくる。
LUNA: 「どうしたの？エンバー！」`,

  graphic: `THE EMBER'S FLAME — Issue #1

★ FULL-PAGE SPREAD: The Crimson Peaks at dawn. A solitary dragon silhouette against a golden sky.

CAPTION BOX: "For three hundred years, the Ember's Flame kept the peace between dragons and the forest folk. Until the morning it vanished."

★ CUT TO: Underground treasury. EMBER stands before an empty pedestal, stunned.

EMBER (internal monologue): "I should have been here. I should have stayed."`,

  script: `STORY: THE EMBER'S FLAME
FORMAT: Audio Narration Script
RUNNING TIME: Approx. 8 minutes

[NARRATOR — warm, gentle tone]
Once upon a time, high in the Crimson Peaks where the clouds kiss the mountain tops, there lived a dragon named Ember…

[PAUSE — 1.5 seconds]

[SFX: Wind through mountain peaks, soft and whistling]

[NARRATOR]
Every morning, Ember would visit the great treasury to see the Flame — a ruby that glowed like a captured sunset. But one morning…

[SFX: Footsteps on stone, then sudden silence]`,
}

export default function BookPage() {
  const { animations, selectedAudience } = useStoryStore()
  const [source, setSource] = useState('recording')
  const [bookType, setBookType] = useState(null)
  const [length, setLength] = useState(20)
  const [generating, setGenerating] = useState(false)
  const [generatedBook, setGeneratedBook] = useState(null)
  const [showExport, setShowExport] = useState(false)

  const canGenerate = bookType && selectedAudience

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setGeneratedBook(null)
    await new Promise((r) => setTimeout(r, 2400))
    setGeneratedBook({
      type: bookType,
      excerpt: MOCK_EXCERPTS[bookType] || MOCK_EXCERPTS.novel,
      title: animations.length > 0 ? animations[0].title : 'My Story',
      pages: length + 8,
    })
    setGenerating(false)
  }

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="sf-hero-label">✦ Publish your story</p>
          <h1 className="sf-hero-title" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.2rem)', marginBottom: 0 }}>
            Book <em>Generation</em>
          </h1>
        </div>
        {generatedBook && (
          <button className="sf-btn-accent" onClick={() => setShowExport(true)}>
            ⬇ Export Book
          </button>
        )}
      </div>

      {/* 2-column grid */}
      <div
        className="sf-grid-2"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}
      >
        {/* LEFT: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Source */}
          <div className="sf-card">
            <div className="sf-card-header">
              <h2 className="sf-card-title">📂 Story Source</h2>
            </div>
            <div className="sf-card-body">
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { id: 'recording', icon: '🎙️', label: 'Original Recording', desc: 'Use the raw story' },
                  { id: 'animation', icon: '✨', label: 'Animated Version',   desc: 'Use the AI-enhanced script' },
                ].map((s) => (
                  <div
                    key={s.id}
                    className={`sf-audience-chip ${source === s.id ? 'selected' : ''}`}
                    style={{
                      flex: 1,
                      padding: '16px',
                      opacity: s.id === 'animation' && animations.length === 0 ? 0.45 : 1,
                      cursor: s.id === 'animation' && animations.length === 0 ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => {
                      if (s.id === 'animation' && animations.length === 0) return
                      setSource(s.id)
                    }}
                  >
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{s.icon}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '3px' }}>{s.label}</div>
                    <div style={{ fontSize: '0.71rem', color: 'var(--muted)' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Book type */}
          <div className="sf-card">
            <div className="sf-card-header">
              <h2 className="sf-card-title">📚 Book Type</h2>
            </div>
            <div className="sf-card-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                {BOOK_TYPES.map((t) => (
                  <div
                    key={t.id}
                    className={`sf-book-type ${bookType === t.id ? 'active' : ''}`}
                    onClick={() => setBookType(bookType === t.id ? null : t.id)}
                  >
                    <div style={{ fontSize: '1.8rem', marginBottom: '7px' }}>{t.icon}</div>
                    <div style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--ink)', marginBottom: '3px' }}>{t.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: '1.4' }}>{t.desc}</div>
                  </div>
                ))}
              </div>

              {/* Audience + length row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', marginBottom: '7px', color: 'var(--ink)' }}>
                    Target Audience
                  </label>
                  <AudienceSelector compact />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <label style={{ fontSize: '0.83rem', fontWeight: '600', color: 'var(--ink)' }}>Length</label>
                    <span style={{ fontSize: '0.83rem', color: 'var(--amber)', fontWeight: '600' }}>~{length} pages</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    style={{ marginBottom: '6px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {['Short', 'Medium', 'Long'].map((l) => (
                      <span key={l} style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            className="sf-btn-primary"
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem', justifyContent: 'center' }}
          >
            {generating ? (
              <>
                <div className="sf-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: 'white' }} />
                Generating your book…
              </>
            ) : (
              '📖 Generate Book'
            )}
          </button>

          {!canGenerate && !generating && (
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '-8px' }}>
              {!bookType ? 'Select a book format above' : 'Select a target audience'}
            </p>
          )}
        </div>

        {/* RIGHT: preview */}
        <div className="sf-card">
          <div className="sf-card-header">
            <h2 className="sf-card-title">📄 Book Preview</h2>
            <span className={`sf-pill ${generatedBook ? 'sf-pill-teal' : ''}`}>
              {generatedBook ? 'Generated ✓' : 'Ready'}
            </span>
          </div>
          <div className="sf-card-body">
            {/* Two-page spread */}
            <div
              style={{
                width: '100%',
                aspectRatio: '3/2',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                display: 'flex',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lift)',
                marginBottom: '18px',
              }}
            >
              <div className="sf-book-page-left">
                {BOOK_TYPES.find((t) => t.id === (generatedBook?.type || bookType || 'novel'))?.icon || '📖'}
                <div
                  style={{
                    position: 'absolute', bottom: '12px', left: 0, right: 0,
                    textAlign: 'center',
                    fontFamily: "'Caveat', cursive",
                    color: '#5a3a1a',
                    fontSize: '0.88rem',
                  }}
                >
                  Page 1
                </div>
              </div>
              <div className="sf-book-page-right">
                {generatedBook ? (
                  <>
                    <p
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        margin: '0 0 8px',
                        color: '#1a1025',
                      }}
                    >
                      {generatedBook.title}
                    </p>
                    <p
                      style={{
                        fontSize: '0.64rem',
                        lineHeight: '1.7',
                        color: '#2a2a2a',
                        whiteSpace: 'pre-line',
                        fontFamily: generatedBook.type === 'novel' || generatedBook.type === 'script'
                          ? 'Georgia, serif'
                          : "'DM Sans', sans-serif",
                        margin: 0,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 16,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {generatedBook.excerpt}
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ height: '14px', background: '#1a1025', borderRadius: '4px', marginBottom: '12px', width: '68%' }} />
                    {[100, 86, 93, 70, 0, 100, 88, 74].map((w, i) =>
                      w === 0 ? (
                        <div key={i} style={{ height: '10px' }} />
                      ) : (
                        <div key={i} style={{ height: '8px', background: '#d0c8b8', borderRadius: '4px', marginBottom: '6px', width: `${w}%` }} />
                      )
                    )}
                    <div style={{ marginTop: '16px', fontFamily: "'Caveat', cursive", fontSize: '0.88rem', color: 'var(--muted)', textAlign: 'center' }}>
                      — Chapter 1 —
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Generated content extras */}
            {generatedBook && (
              <div>
                <div className="sf-status-banner">
                  <BookOpen size={16} /> Book generated! {generatedBook.pages} pages · Ready to export.
                </div>
                <div style={{ marginTop: '14px', padding: '14px', background: 'var(--paper-dark)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: '700', margin: '0 0 6px' }}>
                    {generatedBook.title}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0, lineHeight: '1.6' }}>
                    {generatedBook.excerpt.slice(0, 160)}…
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showExport && <ExportModal type="book" onClose={() => setShowExport(false)} />}
    </div>
  )
}
