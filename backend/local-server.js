'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')

const generateScript = require('./functions/generateScript/index')
const generateImages  = require('./functions/generateImages/index')
const generateAudio   = require('./functions/generateAudio/index')
const renderVideo     = require('./functions/renderVideo/index')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── Lambda adapter ────────────────────────────────────────────────────────────
// Wraps each Lambda handler so it works as an Express route.
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
app.post('/api/generate-script', lambdaRoute(generateScript))
app.post('/api/generate-images', lambdaRoute(generateImages))
app.post('/api/generate-audio',  lambdaRoute(generateAudio))
app.post('/api/render-video',    lambdaRoute(renderVideo))

// ── Full pipeline in one call (convenience for dev) ───────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, audience, style, length } = req.body

    // Step 1: Script
    console.log('[1/4] Generating script…')
    const scriptEvent = { body: { prompt, audience, style, length } }
    const scriptResult = await generateScript.handler(scriptEvent)
    const script = JSON.parse(scriptResult.body)
    if (scriptResult.statusCode !== 200) return res.status(scriptResult.statusCode).json(script)

    // Step 2: Images
    console.log('[2/4] Generating images…')
    const imagesEvent = { body: { jobId: script.jobId, style: script.style, scenes: script.scenes } }
    const imagesResult = await generateImages.handler(imagesEvent)
    const imagesData = JSON.parse(imagesResult.body)

    // Step 3: Audio
    console.log('[3/4] Generating audio…')
    const audioEvent = { body: { jobId: script.jobId, audience: script.audience, scenes: script.scenes } }
    const audioResult = await generateAudio.handler(audioEvent)
    const audioData = JSON.parse(audioResult.body)

    // Step 4: Video
    console.log('[4/4] Rendering video…')
    const videoEvent = {
      body: {
        jobId: script.jobId,
        scenes: script.scenes,
        images: imagesData.images,
        audio: audioData.audio,
      },
    }
    const videoResult = await renderVideo.handler(videoEvent)
    const videoData = JSON.parse(videoResult.body)
    if (videoResult.statusCode !== 200) return res.status(videoResult.statusCode).json(videoData)

    console.log('[✓] Generation complete:', videoData.videoUrl)

    res.json({
      jobId: script.jobId,
      title: script.title,
      style: script.style,
      audience: script.audience,
      scenes: script.scenes,
      videoUrl: videoData.videoUrl,
      videoKey: videoData.videoKey,
    })
  } catch (err) {
    console.error('Pipeline error:', err)
    res.status(500).json({ error: 'Pipeline failed', detail: err.message })
  }
})

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`StoryForge backend running on http://localhost:${PORT}`)
  console.log('Routes:')
  console.log('  POST /api/generate          — full pipeline')
  console.log('  POST /api/generate-script   — Claude story script')
  console.log('  POST /api/generate-images   — DALL-E 3 images')
  console.log('  POST /api/generate-audio    — AWS Polly narration')
  console.log('  POST /api/render-video      — FFmpeg video stitch')
  console.log('  GET  /health')
})
