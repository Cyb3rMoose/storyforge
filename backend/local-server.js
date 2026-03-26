'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')

const transcribeAudio    = require('./functions/transcribeAudio/index')
const generateScript     = require('./functions/generateScript/index')
const generateVideoClips = require('./functions/generateVideoClips/index')
const generateImages     = require('./functions/generateImages/index')
const generateAudio      = require('./functions/generateAudio/index')
const renderVideo        = require('./functions/renderVideo/index')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))  // 50mb to handle base64 audio uploads

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
      res.status(500).json({ error: 'Internal server error', detail: err.message })
    }
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/api/transcribe',          lambdaRoute(transcribeAudio))
app.post('/api/generate-script',     lambdaRoute(generateScript))
app.post('/api/generate-video-clips',lambdaRoute(generateVideoClips))
app.post('/api/generate-images',     lambdaRoute(generateImages))   // kept for reference
app.post('/api/generate-audio',      lambdaRoute(generateAudio))
app.post('/api/render-video',        lambdaRoute(renderVideo))

// ── Full pipeline (video clips + narration) ───────────────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, audience, style, length } = req.body

    console.log('[1/4] Generating script…')
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

    res.json({ jobId: script.jobId, title: script.title, style: script.style, audience: script.audience, scenes: script.scenes, videoUrl: videoData.videoUrl, videoKey: videoData.videoKey })

  } catch (err) {
    console.error('Pipeline error:', err)
    res.status(500).json({ error: 'Pipeline failed', detail: err.message })
  }
})

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`StoryForge backend running on http://localhost:${PORT}`)
  console.log('Routes:')
  console.log('  POST /api/transcribe          — Whisper audio transcription')
  console.log('  POST /api/generate            — full pipeline')
  console.log('  POST /api/generate-script     — Claude story script')
  console.log('  POST /api/generate-video-clips— Runway motion video clips')
  console.log('  POST /api/generate-audio      — AWS Polly narration')
  console.log('  POST /api/render-video        — FFmpeg video stitch')
  console.log('  GET  /health')
})
