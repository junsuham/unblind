import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const playerSource = readFileSync(
  new URL('../src/app/components/GlobalPraisePlayer.tsx', import.meta.url),
  'utf8',
)

describe('global praise player navigation', () => {
  it('deactivates the global player on the praise page', () => {
    expect(playerSource).toContain("pathname.startsWith('/praise')")
    expect(playerSource).toContain('sendPlayerCommand(\'pauseVideo\')')
    expect(playerSource).toContain('onClick={closePlayer}')
  })

  it('does not render decorative-only waveform or speaker controls', () => {
    expect(playerSource).not.toContain('name="speaker"')
    expect(playerSource).not.toContain('[8, 15, 22, 12, 18, 10]')
  })
})

