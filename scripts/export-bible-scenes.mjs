import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const folder = fileURLToPath(new URL('../public/avatars/bible-scenes-v1/', import.meta.url))
const ids = new Set(['eden', 'ararat', 'red-sea', 'sinai', 'bethlehem', 'galilee', 'beatitudes', 'jordan', 'gethsemane', 'emmaus'])

async function writeAsset(path, data, replace) {
  try {
    await writeFile(path, data, { flag: replace ? 'w' : 'wx' })
  } catch (error) {
    if (error.code !== 'EEXIST' || !data.equals(await readFile(path))) throw error
  }
}

async function main(args) {
  const replace = args.includes('--replace')
  const mappings = args.filter((arg) => arg !== '--replace').map((arg) => {
    const separator = arg.indexOf('=')
    const id = arg.slice(0, separator)
    const source = arg.slice(separator + 1)
    if (separator < 1 || !ids.has(id) || !isAbsolute(source) || !source.toLowerCase().endsWith('.png')) {
      throw new Error(`Invalid scene mapping: ${arg}`)
    }
    return { id, source }
  })
  if (!mappings.length || new Set(mappings.map(({ id }) => id)).size !== mappings.length) {
    throw new Error('Usage: node scripts/export-bible-scenes.mjs [--replace] id=/absolute/source.png [...]')
  }

  await mkdir(join(folder, 'thumbs'), { recursive: true })
  for (const { id, source } of mappings) {
    try {
      const input = sharp(source, { limitInputPixels: 16_777_216, failOn: 'error' })
      const meta = await input.metadata()
      if (meta.format !== 'png' || !meta.width || !meta.height || meta.width / meta.height < 1.35) {
        throw new Error('A landscape PNG is required.')
      }
      // Keep the foreground stage and use nearest neighbor so the pixel edges remain sharp.
      const output = await input.removeAlpha()
        .resize(960, 540, { fit: 'cover', position: 'south', kernel: sharp.kernel.nearest })
        .webp({ quality: 88, effort: 6, smartSubsample: true })
        .toBuffer()
      const thumbnail = await sharp(output)
        .resize(320, 180, { kernel: sharp.kernel.nearest })
        .webp({ quality: 80, effort: 6, smartSubsample: true })
        .toBuffer()
      await writeAsset(join(folder, `${id}.webp`), output, replace)
      await writeAsset(join(folder, 'thumbs', `${id}.webp`), thumbnail, replace)
      console.log(`${id}: 960×540 (${output.length.toLocaleString('en-US')} bytes), 320×180 (${thumbnail.length.toLocaleString('en-US')} bytes)`)
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
