const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * Transcribes an audio blob using OpenAI Whisper via the backend.
 *
 * @param {Blob} audioBlob
 * @returns {Promise<string>} transcription text
 */
export function transcribeRecording(audioBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1]
        const res = await post('/api/transcribe', { audio: base64, mimeType: audioBlob.type })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Transcription failed')
        resolve(data.transcription)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(audioBlob)
  })
}

/**
 * Runs the full generation pipeline:
 * Claude script → Runway video clips → Polly audio → FFmpeg video
 *
 * @param {{ prompt: string, audience: string, style: string, length: string }} params
 * @param {(step: number, label: string) => void} onProgress
 * @returns {Promise<{ jobId, title, style, audience, scenes, videoUrl }>}
 */
export async function generateStory({ prompt, audience, style, length }, onProgress) {
  const CLIP_DURATIONS = { '5s': 4, '10s': 8, '20s': 8, '30s': 8 }
  const clipDuration = CLIP_DURATIONS[length] ?? 5

  onProgress?.(1, 'Writing story script…')

  const scriptRes = await post('/api/generate-script', { prompt, audience, style, length })
  const script = await scriptRes.json()
  if (!scriptRes.ok) throw new Error(script.error ?? 'Script generation failed')

  onProgress?.(2, 'Generating video clips with sound…')

  const clipsRes = await post('/api/generate-video-clips', {
    jobId: script.jobId,
    style: script.style,
    scenes: script.scenes,
    clipDuration,
  })
  const clipsData = await clipsRes.json()
  if (!clipsRes.ok) throw new Error(clipsData.error ?? 'Video clip generation failed')

  onProgress?.(3, 'Rendering your story…')

  const videoRes = await post('/api/render-video', {
    jobId: script.jobId,
    clips: clipsData.clips,
  })
  const videoData = await videoRes.json()
  if (!videoRes.ok) throw new Error(videoData.error ?? 'Video render failed')

  return {
    jobId: script.jobId,
    title: script.title,
    style: script.style,
    audience: script.audience,
    scenes: script.scenes,
    videoUrl: videoData.videoUrl,
  }
}

function post(path, body) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
