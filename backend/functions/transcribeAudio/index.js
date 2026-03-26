'use strict'

const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')
const os = require('os')

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Transcribes an audio recording using OpenAI Whisper.
 *
 * Input event:
 *   { audio: <base64 string>, mimeType: string }
 *
 * Returns:
 *   { transcription: string }
 */
exports.handler = async (event) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? event
  const { audio, mimeType = 'audio/webm' } = body

  if (!audio) {
    return response(400, { error: 'audio (base64) is required' })
  }

  const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
  const tmpPath = path.join(os.tmpdir(), `recording_${Date.now()}.${ext}`)

  try {
    fs.writeFileSync(tmpPath, Buffer.from(audio, 'base64'))

    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: 'whisper-1',
      response_format: 'text',
    })

    return response(200, { transcription: transcription.trim() })
  } catch (err) {
    console.error('transcribeAudio error:', err)
    return response(500, { error: 'Transcription failed', detail: err.message })
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
  }
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  }
}
