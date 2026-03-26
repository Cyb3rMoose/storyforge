'use strict'

const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Generates a structured story script from a user prompt.
 *
 * Input event:
 *   { prompt, audience, style, length }
 *     prompt   – free-text story prompt
 *     audience – "toddlers" | "kids" | "tweens" | "teens" | "adults" | "seniors"
 *     style    – "watercolor" | "hand-drawn" | "3d" | "anime" | "storybook" | "silhouette"
 *     length   – "short" (3-4 scenes) | "medium" (6-8 scenes) | "long" (10-12 scenes)
 *
 * Returns:
 *   { jobId, title, style, audience, scenes: [{ id, description, narration, duration }] }
 */
exports.handler = async (event) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? event
  const { prompt, audience = 'kids', style = 'storybook', length = 'medium' } = body

  if (!prompt) {
    return response(400, { error: 'prompt is required' })
  }

  const sceneCount = { short: 4, medium: 7, long: 11 }[length] ?? 7

  const systemPrompt = `You are a creative children's story writer and animator.
Your job is to turn story prompts into structured animation scripts.
Always respond with valid JSON only — no markdown, no commentary.`

  const userPrompt = `Create an animated story script from this prompt:

"${prompt}"

Target audience: ${audience}
Visual style: ${style}
Number of scenes: ${sceneCount}

Respond with this exact JSON structure:
{
  "title": "Story title (5 words or fewer)",
  "scenes": [
    {
      "id": 1,
      "description": "Visual description for the image generator (2-3 sentences, vivid and specific, mention the ${style} art style)",
      "narration": "What the narrator says aloud during this scene (1-3 sentences, age-appropriate for ${audience})",
      "duration": 8
    }
  ]
}

Rules:
- description is for image generation — make it detailed and painterly
- narration is what gets spoken aloud — keep it warm and engaging
- duration is seconds (6-12 per scene based on narration length)
- The story must have a clear beginning, middle, and end
- Keep language appropriate for ${audience}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const raw = message.content[0].text.trim()
    const script = JSON.parse(raw)

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    return response(200, {
      jobId,
      title: script.title,
      style,
      audience,
      scenes: script.scenes.map((s, i) => ({
        id: s.id ?? i + 1,
        description: s.description,
        narration: s.narration,
        duration: s.duration ?? 8,
      })),
    })
  } catch (err) {
    console.error('generateScript error:', err)
    return response(500, { error: 'Failed to generate script', detail: err.message })
  }
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  }
}
