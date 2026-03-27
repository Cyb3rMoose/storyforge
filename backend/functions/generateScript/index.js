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

  // Input validation — LLM01 (Prompt Injection) + LLM10 (Unbounded Consumption)
  const MAX_PROMPT_LENGTH = 500
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return response(400, { error: `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` })
  }
  // Strip control characters that could be used to manipulate the LLM instruction boundary
  const sanitisedPrompt = prompt.replace(/[\x00-\x1F\x7F]/g, '').trim()

  const sceneCount = { '5s': 1, '10s': 1, '20s': 2, '30s': 3 }[length] ?? 1

  const systemPrompt = `You are a creative children's story writer and animator.
Your job is to turn story prompts into structured animation scripts.
Always respond with valid JSON only — no markdown, no commentary.`

  const isMultiScene = sceneCount > 1
  const sceneInstructions = isMultiScene
    ? `Split the story into exactly ${sceneCount} sequential parts that flow as one continuous movie. Part 1 covers the beginning, part ${sceneCount} covers the end. Each part must pick up exactly where the previous left off — same characters, same setting continuity, progressing narrative.`
    : `Capture the full story in a single vivid scene.`

  const userPrompt = `Create a video script from this prompt:

"${sanitisedPrompt}"

Visual style: ${style}
Number of parts: ${sceneCount}

${sceneInstructions}

Respond with this exact JSON structure:
{
  "title": "Story title (5 words or fewer)",
  "scenes": [
    {
      "id": 1,
      "description": "Vivid visual description for video generation (2-3 sentences, specific action and motion, mention the ${style} art style). Must describe what is HAPPENING, not just what things look like.",
      "duration": 10
    }
  ]
}

Rules:
- description is a video generation prompt — focus on motion, action, and atmosphere
- Each scene description must be self-contained but narratively connected to the others
- No text or words should appear in the video
- Keep tone appropriate for ${audience}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const raw = message.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
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
