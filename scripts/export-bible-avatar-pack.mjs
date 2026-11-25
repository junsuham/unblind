import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const width = 192
const height = 224
const horizontalMargin = 8
const ground = height - 8
const maximumSpriteHeight = ground - 12
const invisible = { r: 0, g: 0, b: 0, alpha: 0 }

// An 8-connected alpha outline treats diagonal pixels as part of the sprite.
// Tiny disconnected specks are ignored when determining the crop; a second
// substantial silhouette suggests a sheet or scene, not a single character.
function foreground(pixels, w, h) {
  const mask = new Uint8Array(w * h)
  const queue = new Uint32Array(mask.length)
  let visible = 0
  let transparent = 0

  for (let index = 0; index < mask.length; index++) {
    const alpha = pixels[index * 4 + 3]
    if (alpha >= 32) {
      mask[index] = 1
      visible++
    }
    if (alpha === 0) transparent++
  }

  if (visible < mask.length * 0.03 || transparent < mask.length * 0.02) {
    throw new Error('Input must contain both a visible sprite and genuinely transparent space.')
  }

  let largest = null
  let secondLargest = 0
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start]) continue
    let minX = w
    let maxX = -1
    let minY = h
    let maxY = -1
    let tail = 1
    queue[0] = start
    mask[start] = 0

    for (let head = 0; head < tail; head++) {
      const pixel = queue[head]
      const x = pixel % w
      const y = Math.floor(pixel / w)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)

      for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) {
          const neighbor = yy * w + xx
          if (!mask[neighbor]) continue
          mask[neighbor] = 0
          queue[tail++] = neighbor
        }
      }
    }

    if (!largest || tail > largest.size) {
      secondLargest = largest?.size ?? 0
      largest = { size: tail, minX, maxX, minY, maxY }
    } else if (tail > secondLargest) {
      secondLargest = tail
    }
  }

  if (!largest || largest.size < visible * 0.90 || secondLargest > largest.size * 0.04) {
    throw new Error('Input contains multiple substantial disconnected foreground shapes.')
  }

  const left = Math.max(0, largest.minX - 2)
  const top = Math.max(0, largest.minY - 2)
  return {
    left,
    top,
    width: Math.min(w - 1, largest.maxX + 2) - left + 1,
    height: Math.min(h - 1, largest.maxY + 2) - top + 1,
  }
}

async function convert(source) {
  const input = sharp(source, { limitInputPixels: 16_777_216, failOn: 'error' })
  const metadata = await input.metadata()
  if (metadata.format !== 'png' || !metadata.hasAlpha) {
    throw new Error('Input must be a PNG with an alpha channel.')
  }
  const { data, info } = await input.clone().toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const crop = foreground(data, info.width, info.height)
  const { data: sprite, info: size } = await input
    .extract(crop)
    .resize(width - 2 * horizontalMargin, maximumSpriteHeight, { fit: 'inside', kernel: 'nearest' })
    .png()
    .toBuffer({ resolveWithObject: true })
  const webp = await sharp({ create: { width, height, channels: 4, background: invisible } })
    .composite([{ input: sprite, left: Math.floor((width - size.width) / 2), top: ground - size.height }])
    .webp({ lossless: true, effort: 6 })
    .toBuffer()
  return { webp, source: `${info.width}×${info.height}`, sprite: `${size.width}×${size.height}` }
}

async function main(args) {
  const replace = args.includes('--replace')
  const pack = args.includes('--mbti') ? 'bible-mbti-v1' : 'bible-v1'
  const outputDirectory = fileURLToPath(new URL(`../public/avatars/${pack}/`, import.meta.url))
  const entries = args.filter((arg) => arg !== '--replace' && arg !== '--mbti')
  if (!entries.length) throw new Error('Usage: node scripts/export-bible-avatar-pack.mjs [--replace] [--mbti] id=/absolute/source.png [...]')
  const seen = new Set()
  const sources = entries.map((entry) => {
    const separator = entry.indexOf('=')
    const id = entry.slice(0, separator)
    const source = entry.slice(separator + 1)
    if (separator < 1 || id.length > 40 || !/^[a-z]+(?:-[a-z]+)*$/.test(id) || !isAbsolute(source) || !source.toLowerCase().endsWith('.png') || seen.has(id)) {
      throw new Error(`Invalid or duplicate mapping: ${entry}`)
    }
    seen.add(id)
    return { id, source }
  })

  await mkdir(outputDirectory, { recursive: true })
  for (const { id, source } of sources) {
    try {
      const file = join(outputDirectory, `${id}.webp`)
      const result = await convert(source)
      let action = 'wrote'
      try {
        await writeFile(file, result.webp, { flag: replace ? 'w' : 'wx' })
      } catch (error) {
        if (error.code !== 'EEXIST') throw error
        if (!result.webp.equals(await readFile(file))) {
          throw new Error('A different asset exists; rerun with --replace to overwrite it.')
        }
        action = 'unchanged'
      }
      console.log(`${id}: ${action}; ${result.source} → ${result.sprite} foreground on ${width}×${height}; ${result.webp.length.toLocaleString('en-US')} bytes`)
    } catch (error) {
      console.error(`${id}: ${error.message}`)
      process.exitCode = 1
    }
  }
}

await main(process.argv.slice(2)).catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
