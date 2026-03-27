'use strict'

const RunwayML = require('@runwayml/sdk').default
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const axios = require('axios')

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'eu-west-2' })
const BUCKET = process.env.AWS_S3_BUCKET ?? 'storyforge-media'

const STYLE_PROMPTS = {
  watercolor:   'watercolor painting style, soft washes of color, children\'s book look',
  cartoon:      'hand-drawn cartoon animation style, colorful and whimsical',
  'hand-drawn': 'hand-drawn pencil illustration animation style, sketch look',
  '3d':         '3D animated Pixar-inspired style, vibrant colors, cinematic lighting',
  anime:        'anime animation style, clean lines, expressive characters',
  storybook:    'classic storybook illustration animation style, warm and detailed',
  silhouette:   'silhouette animation style, bold shapes, dramatic gradient sky',
}

const POLL_INTERVAL_MS = 5000
const MAX_POLLS = 60 // 5 min timeout per clip
const MAX_DESC_LENGTH = 500 // LLM05 — cap LLM output before forwarding to Runway

// SSRF guard — API7: only fetch video from HTTPS, non-private hosts (OWASP API7)
function isSafeVideoUrl(url) {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== 'https:') return false
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname === '169.254.169.254'  // AWS metadata endpoint
    ) return false
    return true
  } catch {
    return false
  }
}

/**
 * Generates one Runway Gen-3 video clip per scene and uploads to S3.
 *
 * Input event:
 *   { jobId, style, scenes: [{ id, description }] }
 *
 * Returns:
 *   { jobId, clips: [{ sceneId, s3Key, status }] }
 */
exports.handler = async (event) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? event
  const { jobId, style = 'storybook', scenes } = body

  if (!jobId || !scenes?.length) {
    return response(400, { error: 'jobId and scenes are required' })
  }

  const runway = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET ?? process.env.RUNWAY_API_KEY })
  const stylePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.storybook
  const clipDuration = body.clipDuration ?? 5
  const results = []

  for (const scene of scenes) {
    try {
      // Cap description length before forwarding to Runway (LLM05 — Improper Output Handling)
      const safeDescription = scene.description.slice(0, MAX_DESC_LENGTH)
      const promptText = `${safeDescription}. ${stylePrompt}. Cinematic smooth animation, no text on screen.`
      console.log(`Scene ${scene.id}: generating video clip…`)

      const task = await runway.textToVideo.create({
        model: 'veo3.1_fast',
        promptText,
        duration: clipDuration,
        ratio: '1280:720',
        watermark: false,
      })

      // Poll until done
      let result = await runway.tasks.retrieve(task.id)
      let polls = 0
      while (!['SUCCEEDED', 'FAILED'].includes(result.status) && polls < MAX_POLLS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
        result = await runway.tasks.retrieve(task.id)
        polls++
      }

      if (result.status !== 'SUCCEEDED') {
        throw new Error(result.failure ?? `Task ${result.status} after ${polls} polls`)
      }

      const clipUrl = result.output[0]
      // Validate URL before fetching — prevents SSRF via tampered API response (OWASP API7)
      if (!isSafeVideoUrl(clipUrl)) {
        throw new Error(`Refused to fetch video from untrusted URL: ${clipUrl}`)
      }
      const { data: videoBuffer } = await axios.get(clipUrl, { responseType: 'arraybuffer' })

      const s3Key = `jobs/${jobId}/clips/scene_${scene.id}.mp4`
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: Buffer.from(videoBuffer),
        ContentType: 'video/mp4',
      }))

      results.push({ sceneId: scene.id, s3Key, status: 'ok' })
      console.log(`Scene ${scene.id} clip uploaded: ${s3Key}`)
    } catch (err) {
      console.error(`Scene ${scene.id} clip failed:`, err.message)
      results.push({ sceneId: scene.id, status: 'error', error: err.message })
    }
  }

  const failed = results.filter((r) => r.status === 'error')
  if (failed.length === results.length) {
    return response(500, { error: 'All video clip generations failed', details: results })
  }

  return response(200, { jobId, clips: results })
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  }
}
