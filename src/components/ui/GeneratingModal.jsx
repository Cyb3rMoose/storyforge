import { Check } from 'lucide-react'

const STEPS = [
  'Writing story script',
  'Generating video clips',
  'Rendering your story',
  'Finalising animation',
]

export default function GeneratingModal({ currentStep, stepLabel }) {
  return (
    <div className="sf-overlay">
      <div
        className="sf-card"
        style={{ width: '100%', maxWidth: '380px', padding: '36px 32px' }}
      >
        {/* Spinner */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div className="sf-spinner" style={{ width: 52, height: 52, borderWidth: 3 }} />
        </div>

        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.35rem',
            fontWeight: '700',
            textAlign: 'center',
            color: 'var(--ink)',
            margin: '0 0 6px',
          }}
        >
          Generating Animation
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 24px', maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto' }}>
          {stepLabel ?? 'Bringing your story to life…'}
        </p>

        {/* Progress track */}
        <div
          style={{
            height: '4px',
            background: 'var(--border)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min((currentStep / 4) * 100, 95)}%`,
              background: 'linear-gradient(90deg, var(--rose), var(--amber))',
              borderRadius: '4px',
              transition: 'width 0.6s ease',
            }}
          />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {STEPS.map((step, i) => {
            const isDone = i < currentStep
            const isActive = i === currentStep
            return (
              <div key={step} className="sf-step">
                <div className={`sf-step-dot ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                  {isDone ? <Check size={12} /> : i + 1}
                </div>
                <span
                  style={{
                    fontSize: '0.86rem',
                    color: isDone ? 'var(--teal)' : isActive ? 'var(--ink)' : 'var(--muted)',
                    fontWeight: isActive ? '600' : '400',
                  }}
                >
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
