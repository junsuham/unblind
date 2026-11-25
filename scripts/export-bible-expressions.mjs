import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const WIDTH = 192
const HEIGHT = 224
const FRAME_BYTES = WIDTH * HEIGHT * 4
export const expressionFrames = [null, 'peaceful', 'grateful', 'tired', 'anxious', 'lonely']
const source = fileURLToPath(new URL('../public/avatars/bible-v1/', import.meta.url))
const destination = fileURLToPath(new URL('../public/avatars/bible-expressions-v1/', import.meta.url))

// [near-eye box, far-eye box, unobstructed cheek/nose point, mouth box].
// Each box is independently aligned to the existing 192×224 pixel drawing.
// Mouths obscured by a beard remain in the original artwork.
export const faceGuides = {
  moses: [[85,71,109,87], [119,70,131,86], [112,80]],
  joseph: [[81,79,109,102], [123,79,137,102], [114,96], [109,107,122,112]],
  david: [[81,78,106,98], [119,78,132,98], [112,91], [107,101,120,107]],
  daniel: [[83,79,105,98], [118,79,133,98], [110,94], [105,101,118,106]],
  peter: [[88,77,115,97], [125,77,140,97], [118,91]],
  paul: [[91,70,116,89], [131,70,141,89], [117,85]],
  noah: [[84,69,109,89], [119,69,131,89], [113,77]],
  joshua: [[80,88,109,111], [122,89,135,111], [114,106], [107,113,120,119]],
  elijah: [[85,75,111,93], [123,75,137,94], [115,89]],
  john: [[80,78,108,98], [120,76,136,99], [113,93], [108,101,121,107]],
  sarah: [[93,85,121,103], [131,82,144,103], [121,95], [117,107,134,114]],
  rebekah: [[87,72,111,94], [126,72,137,93], [117,90], [112,96,123,101]],
  miriam: [[86,73,114,94], [124,73,138,93], [118,89], [111,97,125,103]],
  ruth: [[85,74,108,94], [123,74,136,94], [115,89], [111,97,122,103]],
  esther: [[86,75,113,95], [124,74,137,94], [118,91], [115,98,126,103]],
  mary: [[87,77,113,98], [127,77,138,97], [118,91], [114,101,125,107]],
  lydia: [[82,78,113,97], [125,78,136,97], [119,94], [111,99,125,105]],
  priscilla: [[92,82,118,100], [128,81,141,99], [124,95], [119,103,132,109]],
  deborah: [[90,82,114,101], [127,81,140,100], [120,95], [114,101,128,108]],
  hannah: [[86,77,112,97], [122,76,136,97], [117,92], [112,98,124,105]],
}

export function expressionFramePath(id) {
  return join(destination, `${id}.webp`)
}

function get(data, x, y) {
  const offset = (y * WIDTH + x) * 4
  return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]]
}

function set(data, x, y, color) {
  const offset = (y * WIDTH + x) * 4
  if (data[offset + 3] < 224) return
  for (let i = 0; i < 3; i++) data[offset + i] = color[i]
}

function pointSkin(data, x, y) {
  // Median of the marked, unobstructed skin patch; preserves the sprite's complexion.
  const samples = []
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const color = get(data, x + dx, y + dy)
    if (color[3] >= 224 && color[0] > 100 && color[0] > color[1] && color[1] > color[2] + 5) samples.push(color)
  }
  samples.sort((a, b) => a[1] - b[1])
  return samples[Math.floor(samples.length / 2)] ?? get(data, x, y)
}

function nearSkin(data, x, y, box, skin) {
  const sample = (nx, ny) => {
    const p = get(data, nx, ny)
    return p[3] >= 224 && Math.abs(p[0] - skin[0]) < 24 && Math.abs(p[1] - skin[1]) < 26
      && Math.abs((p[0] - p[2]) - (skin[0] - skin[2])) < 18 && p[1] > p[2] + 8 ? p : null
  }
  const outside = [[x, box[1] - 1], [x, box[3]], [box[0] - 1, y], [box[2], y]]
    .map(([nx, ny]) => ({ p: sample(nx, ny), distance: Math.abs(nx - x) + Math.abs(ny - y) }))
    .filter(({ p }) => p)
    .sort((a, b) => a.distance - b.distance)
  if (!outside.length) return skin
  return outside[0].p.map((value, i) => Math.round(.38 * value + .62 * skin[i]))
}

function eyePixel(color, skin) {
  if (color[3] < 224) return false
  const [r, g, b] = color
  const dark = r < skin[0] - 37 && g < skin[1] - 24
  const eyeWhite = r - b < Math.max(23, .53 * (skin[0] - skin[2])) && g > skin[1] - 35
  return dark || eyeWhite
}

function tone(color, shift) {
  return color.slice(0, 3).map((value, i) => Math.max(0, Math.min(255, value + shift[i])))
}

function pointLine(output, points, color, thick = 2) {
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1)
    for (let j = 0; j <= steps; j++) {
      const x = Math.round(ax + (bx - ax) * j / steps)
      const y = Math.round(ay + (by - ay) * j / steps)
      for (let dy = 0; dy < thick; dy++) set(output, x, y + dy, color)
    }
  }
}

function drawEye(original, output, box, skin, mood, far) {
  const [x1, y1, x2, y2] = box
  const w = x2 - x1
  const h = y2 - y1
  const mask = (x, y) => eyePixel(get(original, x, y), skin)
  const ink = tone(skin, [-173, -146, -113]).map((value, i) => Math.max([40, 23, 20][i], value))

  for (let y = y1; y < y2; y++) {
    // Fill the span inside the eyewell as well as the ink itself so the original
    // anti-aliased sclera and iris do not remain as flecks on a closed eyelid.
    let first = x2
    let last = x1 - 1
    for (let x = x1; x < x2; x++) if (mask(x, y)) {
      first = Math.min(first, x)
      last = x
    }
    for (let x = first; x <= last; x++) set(output, x, y, nearSkin(original, x, y, box, skin))
  }

  const left = x1 + Math.max(1, Math.round(.13 * w))
  const right = x2 - Math.max(2, Math.round(.13 * w))
  const middle = Math.round((left + right) / 2)
  if (mood === 'peaceful' || mood === 'grateful') {
    const midY = Math.round(y1 + .55 * h)
    const arch = mood === 'grateful' ? (far ? 2 : 4) : -1
    pointLine(output, [[left, midY], [middle - 2, midY - arch], [middle + 2, midY - arch], [right, midY]], ink, far ? 2 : 3)
    return
  }

  const factor = mood === 'tired' ? .40 : mood === 'lonely' ? .62 : .74
  const squeezed = Math.max(3, Math.round(h * factor))
  const startY = y2 - squeezed - (mood === 'anxious' ? 3 : 0)
  for (let y = startY; y < startY + squeezed; y++) for (let x = x1; x < x2; x++) {
    const fromY = Math.min(y2 - 1, y1 + Math.round((y - startY) * (h - 1) / (squeezed - 1)))
    if (mask(x, fromY)) set(output, x, y, get(original, x, fromY))
  }
  const endOffset = mood === 'tired' ? 0 : far ? -2 : 2
  pointLine(output, [[left, startY + 2], [middle, startY + 1], [right, startY + 2 - endOffset]], ink, far ? 2 : 3)
  if (mood === 'anxious') {
    // A small, lifted inner crease, not an added accessory or a cartoon sweat icon.
    const crease = tone(skin, [-93, -103, -87])
    const browY = Math.max(y1, startY - 4)
    pointLine(output, [[left + 1, browY + (far ? 0 : 2)], [right - 1, browY + (far ? 2 : 0)]], crease, 2)
  }
}

function drawMouth(original, output, box, skin, mood) {
  const [x1, y1, x2, y2] = box
  const x = Math.round((x1 + x2) / 2)
  const y = Math.round((y1 + y2) / 2)
  for (let yy = y1; yy < y2; yy++) for (let xx = x1; xx < x2; xx++) {
    const p = get(original, xx, yy)
    if (p[3] >= 224 && p[0] < skin[0] - 33 && p[1] < skin[1] - 43) {
      set(output, xx, yy, nearSkin(original, xx, yy, box, skin))
    }
  }
  const ink = tone(skin, [-137, -139, -114])
  if (mood === 'grateful') {
    pointLine(output, [[x - 5,y - 1],[x - 3,y + 2],[x + 3,y + 2],[x + 5,y - 1]], ink, 2)
    pointLine(output, [[x - 3,y],[x + 3,y]], tone(skin, [-175, -151, -107]), 2)
  } else if (mood === 'peaceful') {
    pointLine(output, [[x - 3,y],[x - 1,y + 1],[x + 2,y + 1],[x + 4,y]], ink)
  } else if (mood === 'anxious') {
    pointLine(output, [[x - 2,y + 1],[x - 1,y - 1],[x + 2,y - 1],[x + 3,y + 1]], ink, 2)
  } else if (mood === 'lonely') {
    pointLine(output, [[x - 4,y + 2],[x - 2,y],[x + 1,y],[x + 3,y + 1]], ink)
  } else {
    pointLine(output, [[x - 3,y + 1],[x + 3,y]], ink)
  }
}

export function drawMoodPixels(original, id, mood) {
  const guide = faceGuides[id]
  if (!guide || !expressionFrames.includes(mood) || original.length !== FRAME_BYTES) throw new Error('Unknown sprite, mood, or input size')
  const output = Buffer.from(original)
  if (!mood) return output
  const [near, far, [sx, sy], mouth] = guide
  const skin = pointSkin(original, sx, sy)
  drawEye(original, output, near, skin, mood, false)
  drawEye(original, output, far, skin, mood, true)
  if (mouth) drawMouth(original, output, mouth, skin, mood)
  return output
}

async function makeAtlas(id) {
  const { data, info } = await sharp(join(source, `${id}.webp`))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (info.width !== WIDTH || info.height !== HEIGHT) throw new Error(`Unexpected sprite dimensions: ${id}`)
  const width = WIDTH * expressionFrames.length
  const atlas = Buffer.alloc(width * HEIGHT * 4)
  for (const [index, mood] of expressionFrames.entries()) {
    const frame = drawMoodPixels(data, id, mood)
    for (let row = 0; row < HEIGHT; row++) {
      frame.copy(atlas, (row * width + index * WIDTH) * 4, row * WIDTH * 4, (row + 1) * WIDTH * 4)
    }
  }
  const file = await sharp(atlas, { raw: { width, height: HEIGHT, channels: 4 } })
    .webp({ lossless: true, effort: 6 }).toBuffer()
  await writeFile(expressionFramePath(id), file)
  console.log(`${id}: ${file.length.toLocaleString('en-US')} bytes`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(destination, { recursive: true })
  for (const id of Object.keys(faceGuides)) await makeAtlas(id)
}
