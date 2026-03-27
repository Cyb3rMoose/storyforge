'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')

const transcribeAudio    = require('./functions/transcribeAudio/index')
const generateScript     = require('./functions/generateScript/index')
const generateVideoClips = require('./functions/generateVideoClips/index')
const renderVideo        = require('./functions/renderVideo/index')

const app = express()
const isDev = process.env.NODE_ENV !== 'production'

// ── Security headers (OWASP API8 — Security Misconfiguration) ────────────────
app.use(helmet())

// ── CORS — restrict to known frontend origin (OWASP API8) ────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  methods: ['GET', 'POST'],
}))

app.use(express.json({ limit: '50mb' }))

// ── Rate limiters (OWASP API4 — Unrestricted Resource Consumption) ───────────

// Generous limit for all routes — prevents scripted enumeration
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// Strict limit on the generation pipeline — each request costs real money
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Generation rate limit reached. Please wait 15 minutes before trying again.' },
})

// Moderate limit on transcription
const transcribeLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Transcription rate limit reached. Please wait a moment.' },
})

app.use(globalLimiter)

// ── API key authentication (OWASP API2 — Broken Authentication) ──────────────
// Set API_KEY in .env to enable. Disabled when unset (open in local dev).
function requireApiKey(req, res, next) {
  const configured = process.env.API_KEY
  if (!configured) return next()                          // open if not configured
  const provided = req.headers['x-api-key']
  if (!provided || provided !== configured) {
    return res.status(401).json({ error: 'Unauthorised' })
  }
  next()
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── Lambda adapter ────────────────────────────────────────────────────────────
function lambdaRoute(handler) {
  return async (req, res) => {
    try {
      const event = { body: req.body }
      const result = await handler.handler(event)
      const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body
      res.status(result.statusCode ?? 200).json(body)
    } catch (err) {
      console.error(err)
      // Only expose error detail in development (OWASP API8 — information disclosure)
      res.status(500).json({
        error: 'Internal server error',
        ...(isDev && { detail: err.message }),
      })
    }
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/api/transcribe',           transcribeLimiter, requireApiKey, lambdaRoute(transcribeAudio))
app.post('/api/generate-script',      generateLimiter,  requireApiKey, lambdaRoute(generateScript))
app.post('/api/generate-video-clips', generateLimiter,  requireApiKey, lambdaRoute(generateVideoClips))
app.post('/api/render-video',         generateLimiter,  requireApiKey, lambdaRoute(renderVideo))

// ── Full pipeline ─────────────────────────────────────────────────────────────
app.post('/api/generate', generateLimiter, requireApiKey, async (req, res) => {
  try {
    const { prompt, audience, style, length } = req.body

    console.log('[1/3] Generating script…')
    const scriptResult = await generateScript.handler({ body: { prompt, audience, style, length } })
    const script = JSON.parse(scriptResult.body)
    if (scriptResult.statusCode !== 200) return res.status(scriptResult.statusCode).json(script)

    const CLIP_DURATIONS = { '5s': 4, '10s': 8, '20s': 8, '30s': 8 }
    const clipDuration = CLIP_DURATIONS[length] ?? 5

    console.log('[2/3] Generating video clips…')
    const clipsResult = await generateVideoClips.handler({ body: { jobId: script.jobId, style: script.style, scenes: script.scenes, clipDuration } })
    const clipsData = JSON.parse(clipsResult.body)

    console.log('[3/3] Rendering video…')
    const videoResult = await renderVideo.handler({ body: { jobId: script.jobId, clips: clipsData.clips } })
    const videoData = JSON.parse(videoResult.body)
    if (videoResult.statusCode !== 200) return res.status(videoResult.statusCode).json(videoData)

    console.log('[✓] Generation complete:', videoData.videoUrl)

    res.json({
      jobId:    script.jobId,
      title:    script.title,
      style:    script.style,
      audience: script.audience,
      scenes:   script.scenes,
      videoUrl: videoData.videoUrl,
      videoKey: videoData.videoKey,
    })

  } catch (err) {
    console.error('Pipeline error:', err)
    res.status(500).json({
      error: 'Pipeline failed',
      ...(isDev && { detail: err.message }),
    })
  }
})

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`StoryForge backend running on http://localhost:${PORT}`)
  console.log('Security: rate limiting active, API key auth ' + (process.env.API_KEY ? 'ENABLED' : 'DISABLED (set API_KEY to enable)'))
  console.log('Routes:')
  console.log('  GET  /health')
  console.log('  POST /api/transcribe')
  console.log('  POST /api/generate             — full pipeline')
  console.log('  POST /api/generate-script')
  console.log('  POST /api/generate-video-clips')
  console.log('  POST /api/render-video')
})
