import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import AudioRecorder from '../components/record/AudioRecorder'
import StoryPrompt from '../components/record/StoryPrompt'
import AudienceSelector from '../components/record/AudienceSelector'
import StyleSelector from '../components/record/StyleSelector'
import GeneratingModal from '../components/ui/GeneratingModal'
import useStoryStore from '../store/useStoryStore'
import { generateStory } from '../api/storyforge'

const STYLES_META = {
  watercolor:  { label: '🎨 Watercolor & Illustrated' },
  cartoon:     { label: '✏️ Hand-drawn Cartoon' },
  '3d':        { label: '🖥️ 3D Animated (Pixar-style)' },
  anime:       { label: '🗾 Anime / Manga Style' },
  storybook:   { label: '📖 Storybook Flat Design' },
  silhouette:  { label: '🌑 Silhouette & Shadow' },
}

const AUDIENCES_META = {
  toddlers:     'Toddlers',
  'young-kids': 'Young Kids',
  children:     'Children',
  teens:        'Teens',
  'young-adults': 'Young Adults',
  adults:       'Adults',
  family:       'Family',
  education:    'Educational',
}

export default function RecordPage() {
  const navigate = useNavigate()
  const {
    inputMode, setInputMode,
    recordings, storyPrompt,
    selectedAudience, selectedStyle, selectedLength,
    addAnimation,
  } = useStoryStore()

  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [genStepLabel, setGenStepLabel] = useState('')
  const [genError, setGenError] = useState(null)

  const hasContent =
    inputMode === 'record' ? recordings.length > 0 : storyPrompt.trim().length > 10
  const canGenerate = hasContent && selectedAudience && selectedStyle

  const hintText = !hasContent
    ? inputMode === 'record'
      ? 'Record a story or write a prompt, then select an audience'
      : 'Write a prompt, then select an audience'
    : !selectedAudience
    ? 'Now select a target audience →'
    : !selectedStyle
    ? 'Now select an animation style →'
    : '✓ Ready to generate!'

  const handleGenerate = async () => {
    setGenerating(true)
    setGenStep(0)
    setGenError(null)

    const prompt =
      inputMode === 'prompt' && storyPrompt.trim()
        ? storyPrompt
        : recordings[0]?.transcription ?? storyPrompt

    try {
      const result = await generateStory(
        { prompt, audience: selectedAudience, style: selectedStyle, length: selectedLength },
        (step, label) => {
          setGenStep(step)
          setGenStepLabel(label)
        }
      )

      setGenStep(4)
      setGenStepLabel('Finalising animation…')
      await new Promise((r) => setTimeout(r, 600))

      addAnimation({
        id: result.jobId,
        title: result.title,
        audience: AUDIENCES_META[result.audience] || result.audience,
        style: STYLES_META[result.style]?.label || result.style,
        source: inputMode,
        prompt,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        duration: `${Math.round(result.scenes.reduce((acc, s) => acc + (s.duration ?? 8), 0) / 60)}:${String(result.scenes.reduce((acc, s) => acc + (s.duration ?? 8), 0) % 60).padStart(2, '0')}`,
        scenes: result.scenes.length,
        videoUrl: result.videoUrl,
        thumb: { from: '#1a0a2e', via: '#3a1a5e', to: '#6b21a8' },
        description: prompt,
        sceneList: result.scenes.map((s, i) => ({
          id: `s${s.id}`,
          label: `Scene ${s.id}`,
          desc: s.description.slice(0, 60) + '…',
          narration: s.narration,
          from: ['#1a0533', '#0f2d4a', '#064e3b', '#1c1917', '#713f12'][i % 5],
          to:   ['#4c1d95', '#1e40af', '#047857', '#44403c', '#92400e'][i % 5],
        })),
      })

      navigate('/editor')
    } catch (err) {
      console.error('Generation failed:', err)
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Hero */}
      <p className="sf-hero-label">✦ Tell your story</p>
      <h1 className="sf-hero-title">
        Record. Imagine.<br /><em>Animate.</em>
      </h1>
      <p style={{ fontSize: '0.95rem', color: 'var(--muted)', maxWidth: '460px', lineHeight: '1.6', marginBottom: '36px' }}>
        Speak your story aloud or describe it by prompt — StoryForge will animate it and tailor the experience to your audience.
      </p>

      {/* 2-column grid */}
      <div
        className="sf-grid-2"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}
      >
        {/* LEFT: Input card */}
        <div className="sf-card">
          <div className="sf-inner-tab-bar">
            <button
              className={`sf-inner-tab ${inputMode === 'record' ? 'active' : ''}`}
              onClick={() => setInputMode('record')}
            >
              🎙 Record Your Story
            </button>
            <button
              className={`sf-inner-tab ${inputMode === 'prompt' ? 'active' : ''}`}
              onClick={() => setInputMode('prompt')}
            >
              ✏️ Prompt Your Story
            </button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: inputMode === 'record' ? 'block' : 'none' }}>
              <AudioRecorder />
            </div>
            <div style={{ display: inputMode === 'prompt' ? 'block' : 'none' }}>
              <StoryPrompt />
            </div>
          </div>
        </div>

        {/* RIGHT: Audience + style + generate */}
        <div className="sf-card">
          <div className="sf-card-header">
            <h2 className="sf-card-title">🎯 Target Audience</h2>
            <span className="sf-pill-violet sf-pill" style={{ fontWeight: 600 }}>
              {selectedAudience
                ? AUDIENCES_META[selectedAudience] || selectedAudience
                : 'None selected'}
            </span>
          </div>
          <div className="sf-card-body">
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '14px', lineHeight: '1.5' }}>
              Our AI tailors the characters, language, and visual style to the right audience.
            </p>
            <AudienceSelector />

            <div style={{ height: '1px', background: 'var(--border)', margin: '18px 0' }} />

            <StyleSelector />

            <button
              className="sf-btn-primary"
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem', marginTop: '4px' }}
            >
              <Sparkles size={17} />
              Generate Animation
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--muted)', marginTop: '9px' }}>
              {hintText}
            </p>
          </div>
        </div>
      </div>

      {generating && <GeneratingModal currentStep={genStep} stepLabel={genStepLabel} />}

      {genError && (
        <div className="sf-status-banner" style={{ marginTop: '20px', background: 'rgba(212,84,122,0.08)', border: '1.5px solid rgba(212,84,122,0.3)', color: 'var(--rose)' }}>
          ⚠️ Generation failed: {genError}. Please try again.
        </div>
      )}
    </div>
  )
}
