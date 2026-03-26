'use strict'

const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const polly = new PollyClient({ region: process.env.AWS_REGION ?? 'eu-west-2' })
const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'eu-west-2' })
const BUCKET = process.env.AWS_S3_BUCKET ?? 'storyforge-media'

// Narrator voices mapped to audience type
const VOICES = {
  toddlers:      { VoiceId: 'Joanna',  Engine: 'neural' },
  'young-kids':  { VoiceId: 'Joanna',  Engine: 'neural' },
  children:      { VoiceId: 'Joanna',  Engine: 'neural' },
  kids:          { VoiceId: 'Joanna',  Engine: 'neural' },
  tweens:        { VoiceId: 'Matthew', Engine: 'neural' },
  teens:         { VoiceId: 'Matthew', Engine: 'neural' },
  'young-adults':{ VoiceId: 'Matthew', Engine: 'neural' },
  adults:        { VoiceId: 'Ruth',    Engine: 'neural' },
  family:        { VoiceId: 'Joanna',  Engine: 'neural' },
  education:     { VoiceId: 'Ruth',    Engine: 'neural' },
  seniors:       { VoiceId: 'Ruth',    Engine: 'neural' },
}

/**
 * Synthesises narration audio for each scene using AWS Polly.
 *
 * Input event:
 *   { jobId, audience, scenes: [{ id, narration }] }
 *
 * Returns:
 *   { jobId, audio: [{ sceneId, s3Key, durationMs }] }
 */
exports.handler = async (event) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? event
  const { jobId, audience = 'kids', scenes } = body

  if (!jobId || !scenes?.length) {
    return response(400, { error: 'jobId and scenes are required' })
  }

  const voice = VOICES[audience] ?? VOICES.kids
  const results = []

  for (const scene of scenes) {
    try {
      const command = new SynthesizeSpeechCommand({
        Text: scene.narration,
        OutputFormat: 'mp3',
        VoiceId: voice.VoiceId,
        Engine: voice.Engine,
        LanguageCode: 'en-US',
      })

      const { AudioStream } = await polly.send(command)

      // Collect stream into buffer
      const chunks = []
      for await (const chunk of AudioStream) {
        chunks.push(chunk)
      }
      const audioBuffer = Buffer.concat(chunks)

      const s3Key = `jobs/${jobId}/audio/scene_${scene.id}.mp3`
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
      }))

      // Rough duration estimate: ~130 words per minute for narration
      const wordCount = scene.narration.split(/\s+/).length
      const durationMs = Math.round((wordCount / 130) * 60 * 1000)

      results.push({ sceneId: scene.id, s3Key, durationMs, status: 'ok' })
      console.log(`Scene ${scene.id} audio uploaded: ${s3Key} (~${durationMs}ms)`)
    } catch (err) {
      console.error(`Scene ${scene.id} audio failed:`, err.message)
      results.push({ sceneId: scene.id, status: 'error', error: err.message })
    }
  }

  const failed = results.filter((r) => r.status === 'error')
  if (failed.length === results.length) {
    return response(500, { error: 'All audio generations failed', details: results })
  }

  return response(200, { jobId, audio: results })
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  }
}
