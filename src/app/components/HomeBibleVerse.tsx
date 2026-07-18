'use client'

import { useEffect, useState } from 'react'
import { getRandomBibleVerse, type BibleVerse } from '@/lib/bibleVerses'

const SESSION_VERSE_KEY = 'unblind-launch-bible-verse-v1'

function readSessionVerse() {
  try {
    const stored = window.sessionStorage.getItem(SESSION_VERSE_KEY)
    if (!stored) return null

    const verse = JSON.parse(stored) as Partial<BibleVerse>
    if (typeof verse.text !== 'string' || typeof verse.reference !== 'string') return null
    return verse as BibleVerse
  } catch {
    return null
  }
}

export function HomeBibleVerse() {
  const [verse, setVerse] = useState<BibleVerse | null>(null)

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const stored = readSessionVerse()
      if (stored) {
        setVerse(stored)
        return
      }

      const selected = getRandomBibleVerse()
      setVerse(selected)
      try {
        window.sessionStorage.setItem(SESSION_VERSE_KEY, JSON.stringify(selected))
      } catch {
        // Keep the verse in memory when Safari private storage is unavailable.
      }
    }, 0)

    return () => window.clearTimeout(hydrationTimer)
  }, [])

  return (
    <section data-home-section="verse" className="mb-4" aria-label="오늘의 말씀">
      <p className="mb-1.5 px-1 text-[9px] font-bold tracking-[0.08em] text-white/58">오늘의 말씀</p>
      <div className="min-h-[68px] rounded-[16px] bg-white/12 px-4 py-3 text-white shadow-sm backdrop-blur-xl">
        {verse ? (
          <>
            <p className="line-clamp-2 text-[13px] font-semibold leading-[19px]">“{verse.text}”</p>
            <p className="mt-1 text-right text-[11px] text-white/68">{verse.reference}</p>
          </>
        ) : (
          <div className="h-[42px] animate-pulse rounded-[10px] bg-white/8" aria-hidden />
        )}
      </div>
    </section>
  )
}
