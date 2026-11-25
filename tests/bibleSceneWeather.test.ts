import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FaithAvatarWeather } from '../src/app/components/FaithAvatarWeather'
import { faithWeatherOptions } from '../src/lib/dailyFaith'

describe('Bible avatar weather layers', () => {
  it.each(faithWeatherOptions)('reflects $label immediately without altering the scene', ({ value }) => {
    const stageWeather = renderToStaticMarkup(FaithAvatarWeather({ weather: value, sceneId: 'galilee' }))
    expect(stageWeather).toContain(`data-weather="${value}"`)
    expect(stageWeather).toContain('data-water="true"')
    expect(stageWeather).toContain('aria-hidden="true"')
    expect(stageWeather).not.toContain('<img')
  })

  it('marks night scenes so a clear sky can keep the original hour', () => {
    const night = renderToStaticMarkup(FaithAvatarWeather({ weather: 'sunny', sceneId: 'gethsemane' }))
    const day = renderToStaticMarkup(FaithAvatarWeather({ weather: null, sceneId: 'eden' }))
    expect(night).toContain('data-night="true"')
    expect(day).toContain('data-night="false"')
    expect(day).toContain('data-weather="unset"')
  })

  it('keeps weather decoration non-interactive and respects reduced motion', () => {
    const css = readFileSync(new URL('../src/app/components/FaithAvatarWeather.module.css', import.meta.url), 'utf8')
    expect(css).toContain('pointer-events: none;')
    expect(css).toContain('prefers-reduced-motion: reduce')
    expect(css).toContain('animation: none')
  })
})
