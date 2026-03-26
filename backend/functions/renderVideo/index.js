'use strict'

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
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
 * Downloads scene images + audio from S3, stitches them into a video using FFmpeg,
 * then uploads the final .mp4 back to S3.
 *
 * Input event:
 *   { jobId, scenes: [{ id, duration }], images: [{ sceneId, s3Key }], audio: [{ sceneId, s3Key, durationMs }] }
 *
 * Returns:
 *   { jobId, videoKey, videoUrl }
 */
exports.handler = async (event) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? event
  const { jobId, scenes, images, audio } = body

  if (!jobId || !scenes?.length || !images?.length || !audio?.length) {
    return response(400, { error: 'jobId, scenes, images, and audio are required' })
  }

  const workDir = path.join(TMP, jobId)
  fs.mkdirSync(workDir, { recursive: true })

  try {
    // ── 1. Download all assets from S3 ────────────────────────────────────────
    const imageMap = {}
    const audioMap = {}

    for (const img of images) {
      if (img.status === 'error') continue
      const localPath = path.join(workDir, `scene_${img.sceneId}.png`)
      await downloadFromS3(img.s3Key, localPath)
      imageMap[img.sceneId] = localPath
    }

    for (const aud of audio) {
      if (aud.status === 'error') continue
      const localPath = path.join(workDir, `scene_${aud.sceneId}.mp3`)
      await downloadFromS3(aud.s3Key, localPath)
      audioMap[aud.sceneId] = { path: localPath, durationMs: aud.durationMs }
    }

    // ── 2. Build per-scene video clips (image + audio, Ken Burns zoom) ────────
    const clipPaths = []

    for (const scene of scenes) {
      const imgPath = imageMap[scene.id]
      const audData = audioMap[scene.id]
      if (!imgPath || !audData) continue

      const clipPath = path.join(workDir, `clip_${scene.id}.mp4`)
      const durationSec = Math.max(audData.durationMs / 1000, scene.duration ?? 8)

      await renderClip(imgPath, audData.path, clipPath, durationSec)
      clipPaths.push(clipPath)
      console.log(`Rendered clip for scene ${scene.id}: ${clipPath}`)
    }

    if (!clipPaths.length) {
      throw new Error('No clips were rendered successfully')
    }

    // ── 3. Concatenate clips into final video ─────────────────────────────────
    const outputPath = path.join(workDir, 'final.mp4')
    await concatenateClips(clipPaths, outputPath)

    // ── 4. Upload final video to S3 ───────────────────────────────────────────
    const videoKey = `jobs/${jobId}/final.mp4`
    const videoBuffer = fs.readFileSync(outputPath)

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: videoKey,
      Body: videoBuffer,
      ContentType: 'video/mp4',
    }))

    console.log(`Final video uploaded: ${videoKey}`)

    return response(200, {
      jobId,
      videoKey,
      videoUrl: `https://${BUCKET}.s3.${process.env.AWS_REGION ?? 'eu-west-2'}.amazonaws.com/${videoKey}`,
    })
  } finally {
    // Clean up temp files
    fs.rmSync(workDir, { recursive: true, force: true })
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function downloadFromS3(key, localPath) {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const chunks = []
  for await (const chunk of Body) chunks.push(chunk)
  fs.writeFileSync(localPath, Buffer.concat(chunks))
}

function renderClip(imagePath, audioPath, outputPath, durationSec) {
  return new Promise((resolve, reject) => {
    // Ken Burns effect: slow zoom from 100% to 108% over the clip duration
    const zoomFilter = `zoompan=z='min(zoom+0.0015,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(durationSec * 25)}:s=1792x1024:fps=25`

    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1'])
      .input(audioPath)
      .videoFilter(zoomFilter)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-pix_fmt yuv420p',
        `-t ${durationSec}`,
        '-shortest',
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
    const fileList = clipPaths.map((p) => `file '${p}'`).join('\n')
    fs.writeFileSync(listFile, fileList)

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
