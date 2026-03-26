'use strict'

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const fs = require('fs')
const path = require('path')
const os = require('os')

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'eu-west-2' })
const BUCKET = process.env.AWS_S3_BUCKET ?? 'storyforge-media'
const TMP = os.tmpdir()

/**
 * Downloads scene video clips + audio from S3, overlays narration audio on each clip
 * (looping the clip to cover full narration), concatenates into final.mp4, uploads to S3.
 *
 * Input event:
 *   { jobId, scenes: [{ id, duration }], clips: [{ sceneId, s3Key }], audio: [{ sceneId, s3Key, durationMs }] }
 *
 * Returns:
 *   { jobId, videoKey, videoUrl }
 */
exports.handler = async (event) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? event
  const { jobId, scenes, clips, audio } = body

  if (!jobId || !scenes?.length || !clips?.length || !audio?.length) {
    return response(400, { error: 'jobId, scenes, clips, and audio are required' })
  }

  const workDir = path.join(TMP, jobId)
  fs.mkdirSync(workDir, { recursive: true })

  try {
    // ── 1. Download all assets from S3 ────────────────────────────────────────
    const clipMap = {}
    const audioMap = {}

    for (const clip of clips) {
      if (clip.status === 'error') continue
      const localPath = path.join(workDir, `scene_${clip.sceneId}.mp4`)
      await downloadFromS3(clip.s3Key, localPath)
      clipMap[clip.sceneId] = localPath
    }

    for (const aud of audio) {
      if (aud.status === 'error') continue
      const localPath = path.join(workDir, `scene_${aud.sceneId}.mp3`)
      await downloadFromS3(aud.s3Key, localPath)
      audioMap[aud.sceneId] = { path: localPath, durationMs: aud.durationMs }
    }

    // ── 2. Overlay narration audio on each video clip (looping clip to fill audio) ──
    const muxedPaths = []

    for (const scene of scenes) {
      const clipPath = clipMap[scene.id]
      const audData = audioMap[scene.id]
      if (!clipPath || !audData) continue

      const muxedPath = path.join(workDir, `muxed_${scene.id}.mp4`)
      await overlayAudio(clipPath, audData.path, muxedPath)
      muxedPaths.push(muxedPath)
      console.log(`Muxed clip for scene ${scene.id}: ${muxedPath}`)
    }

    if (!muxedPaths.length) {
      throw new Error('No clips were muxed successfully')
    }

    // ── 3. Concatenate into final video ───────────────────────────────────────
    const outputPath = path.join(workDir, 'final.mp4')
    await concatenateClips(muxedPaths, outputPath)

    // ── 4. Upload to S3 ───────────────────────────────────────────────────────
    const videoKey = `jobs/${jobId}/final.mp4`
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: videoKey,
      Body: fs.readFileSync(outputPath),
      ContentType: 'video/mp4',
    }))

    console.log(`Final video uploaded: ${videoKey}`)

    const videoUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: videoKey }),
      { expiresIn: 3600 },
    )

    return response(200, { jobId, videoKey, videoUrl })
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadFromS3(key, localPath) {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const chunks = []
  for await (const chunk of Body) chunks.push(chunk)
  fs.writeFileSync(localPath, Buffer.concat(chunks))
}

/**
 * Overlays narration audio onto a video clip, looping the video to match audio length.
 */
function overlayAudio(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .inputOptions(['-stream_loop -1'])  // loop video until audio ends
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-pix_fmt yuv420p',
        '-map 0:v:0',
        '-map 1:a:0',
        '-shortest',  // stop when audio finishes
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

function concatenateClips(clipPaths, outputPath) {
  return new Promise((resolve, reject) => {
    const listFile = outputPath.replace('.mp4', '_list.txt')
    fs.writeFileSync(listFile, clipPaths.map((p) => `file '${p}'`).join('\n'))

    ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run()
  })
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  }
}
