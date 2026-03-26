'use strict'

const OpenAI = require('openai')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const axios = require('axios')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'eu-west-2' })
const BUCKET = process.env.AWS_S3_BUCKET ?? 'storyforge-media'

const STYLE_SUFFIXES = {
  watercolor:   'watercolor painting, soft washes of color, gentle textures, children\'s book illustration',
  cartoon:      'hand-drawn cartoon illustration, sketch style, whimsical, children\'s book',
  'hand-drawn': 'hand-drawn pencil and ink illustration, sketch style, whimsical, children\'s book',
  '3d':         '3D rendered animation style, Pixar-inspired, vibrant colors, cinematic lighting',
  anime:        'anime illustration style, clean lines, expressive characters, vivid colors',
  storybook:    'classic storybook illustration, warm colors, detailed backgrounds, nostalgic feel',
  silhouette:   'silhouette art style, bold shapes, gradient sunset background, dramatic contrast',
}

/**
 * Generates one DALL-E 3 image per scene and uploads to S3.
 *
 * Input event:
 *   { jobId, style, scenes: [{ id, description }] }
 *
 * Returns:
 *   { jobId, images: [{ sceneId, s3Key, url }] }
 */
exports.handler = async (event) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? event
  const { jobId, style = 'storybook', scenes } = body

  if (!jobId || !scenes?.length) {
    return response(400, { error: 'jobId and scenes are required' })
  }

  const styleSuffix = STYLE_SUFFIXES[style] ?? STYLE_SUFFIXES.storybook

  const results = []

  // Generate images sequentially to avoid rate limits
  for (const scene of scenes) {
    const safePrefix = 'Safe for children, family-friendly illustration. '
    const attempts = [
      `${safePrefix}${scene.description}. Art style: ${styleSuffix}. No text or words in the image.`,
      `${safePrefix}A gentle, colourful scene from a children's animated story. Art style: ${styleSuffix}. No text or words in the image.`,
    ]

    let uploaded = false
    for (const prompt of attempts) {
      try {
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
          response_format: 'url',
        })

        const imageUrl = imageResponse.data[0].url
        const { data: imageBuffer } = await axios.get(imageUrl, { responseType: 'arraybuffer' })

        const s3Key = `jobs/${jobId}/images/scene_${scene.id}.png`
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: Buffer.from(imageBuffer),
          ContentType: 'image/png',
        }))

        results.push({ sceneId: scene.id, s3Key, status: 'ok' })
        console.log(`Scene ${scene.id} image uploaded: ${s3Key}`)
        uploaded = true
        break
      } catch (err) {
        const isSafetyBlock = err.status === 400 || err.message?.includes('safety')
        if (isSafetyBlock && prompt === attempts[0]) {
          console.warn(`Scene ${scene.id} safety block — retrying with fallback prompt`)
          continue
        }
        console.error(`Scene ${scene.id} image failed:`, err.message)
        results.push({ sceneId: scene.id, status: 'error', error: err.message })
        break
      }
    }

    if (!uploaded && !results.find((r) => r.sceneId === scene.id)) {
      results.push({ sceneId: scene.id, status: 'error', error: 'All prompt attempts blocked by safety filter' })
    }
  }

  const failed = results.filter((r) => r.status === 'error')
  if (failed.length === results.length) {
    return response(500, { error: 'All image generations failed', details: results })
  }

  return response(200, { jobId, images: results })
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  }
}
