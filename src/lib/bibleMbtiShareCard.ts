import { bibleCharacterImages, type BibleMbtiResult } from './bibleCharacterMbti'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Character image could not be loaded'))
    image.src = source
  })
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  )
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Result image could not be created'))
    }, 'image/png')
  })
}

export async function createBibleMbtiShareImage(result: BibleMbtiResult) {
  await document.fonts?.ready

  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
  background.addColorStop(0, '#2a1712')
  background.addColorStop(0.52, '#130f0e')
  background.addColorStop(1, '#080707')
  context.fillStyle = background
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const glow = context.createRadialGradient(540, 280, 40, 540, 280, 690)
  glow.addColorStop(0, 'rgba(228, 83, 48, 0.48)')
  glow.addColorStop(1, 'rgba(228, 83, 48, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, CARD_WIDTH, 900)

  roundedRect(context, 58, 58, 964, 1234, 66)
  context.fillStyle = 'rgba(35, 31, 30, 0.92)'
  context.fill()
  context.strokeStyle = 'rgba(255, 255, 255, 0.16)'
  context.lineWidth = 2
  context.stroke()

  context.textAlign = 'center'
  context.fillStyle = '#f27652'
  context.font = '800 24px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif'
  context.fillText('MY BIBLE CHARACTER TYPE INDICATOR', 540, 116)

  const characterImage = await loadImage(bibleCharacterImages[result.type])
  roundedRect(context, 160, 154, 760, 760, 56)
  context.save()
  context.clip()
  drawCoverImage(context, characterImage, 160, 154, 760, 760)
  const portraitShade = context.createLinearGradient(0, 650, 0, 914)
  portraitShade.addColorStop(0, 'rgba(11, 8, 7, 0)')
  portraitShade.addColorStop(1, 'rgba(11, 8, 7, 0.56)')
  context.fillStyle = portraitShade
  context.fillRect(160, 154, 760, 760)
  context.restore()
  roundedRect(context, 160, 154, 760, 760, 56)
  context.strokeStyle = 'rgba(255, 255, 255, 0.18)'
  context.lineWidth = 3
  context.stroke()

  roundedRect(context, 442, 866, 196, 66, 33)
  context.fillStyle = '#e45330'
  context.fill()
  context.fillStyle = '#ffffff'
  context.font = '900 30px -apple-system, BlinkMacSystemFont, sans-serif'
  context.fillText(result.type, 540, 909)

  context.fillStyle = '#b7aaa5'
  context.font = '700 24px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif'
  context.fillText('나와 닮은 성경 인물', 540, 982)

  context.fillStyle = '#ffffff'
  context.font = '900 72px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif'
  context.fillText(result.character.name, 540, 1060)

  context.fillStyle = '#f27652'
  context.font = '800 30px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif'
  context.fillText(result.character.tagline, 540, 1112, 840)

  context.fillStyle = '#d4cbc7'
  context.font = '700 25px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif'
  context.fillText(result.character.traits.join('  ·  '), 540, 1170, 880)

  context.fillStyle = '#817571'
  context.font = '700 21px -apple-system, BlinkMacSystemFont, sans-serif'
  context.fillText(`성향 선명도 ${result.similarity}%`, 540, 1220)
  context.fillStyle = '#e9e2df'
  context.font = '900 25px -apple-system, BlinkMacSystemFont, serif'
  context.fillText('UNBLIND', 540, 1262)

  const blob = await canvasToPng(canvas)
  return new File([blob], `unblind-bible-mbti-${result.type.toLowerCase()}.png`, {
    type: 'image/png',
  })
}
