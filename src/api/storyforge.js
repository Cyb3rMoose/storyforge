const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/**
 * Runs the full generation pipeline:
 * Claude script → DALL-E images → Polly audio → FFmpeg video
 *
 * @param {{ prompt: string, audience: string, style: string, length: string }} params
 * @param {(step: number, label: string) => void} onProgress  - called at each pipeline step (1-4)
 * @returns {Promise<{ jobId, title, style, audience, scenes, videoUrl }>}
 */
export async function generateStory({ prompt, audience, style, length }, onProgress) {
  onProgress?.(1, 'Writing story script…')

  const scriptRes = await post('/api/generate-script', { prompt, audience, style, length })
  const script = await scriptRes.json()
  if (!scriptRes.ok) throw new Error(script.error ?? 'Script generation failed')

  onProgress?.(2, 'Painting scenes…')

  const imagesRes = await post('/api/generate-images', {
    jobId: script.jobId,
    style: script.style,
    scenes: script.scenes,
  })
  const imagesData = await imagesRes.json()

  onProgress?.(3, 'Recording narration…')

  const audioRes = await post('/api/generate-audio', {
    jobId: script.jobId,
    audience: script.audience,
    scenes: script.scenes,
  })
  const audioData = await audioRes.json()

  onProgress?.(4, 'Rendering your story…')

  const videoRes = await post('/api/render-video', {
    jobId: script.jobId,
    scenes: script.scenes,
    images: imagesData.images,
    audio: audioData.audio,
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
